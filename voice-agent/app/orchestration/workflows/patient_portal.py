"""
Patient Portal Appointment Workflow
Handles appointment booking for authenticated patient portal users
"""

from typing import Dict, Any, List
import structlog
import httpx
from datetime import datetime, timedelta

from app.models.intents import Intent
from app.models.responses import WorkflowResult
from app.orchestration.workflows.base import BaseWorkflow

logger = structlog.get_logger()

# Patient Portal API Base URL
PATIENT_PORTAL_API = "http://localhost:5001/api/v1/patient"


class PatientPortalWorkflow(BaseWorkflow):
    """
    Workflow for patient portal appointment management.
    Uses patient's JWT token to authenticate API calls.
    """
    
    @property
    def supported_intents(self) -> List[Intent]:
        return [
            Intent.BOOK_APPOINTMENT,
            Intent.RESCHEDULE_APPOINTMENT,
            Intent.CANCEL_APPOINTMENT,
            Intent.CHECK_APPOINTMENT_STATUS,
            Intent.GENERAL_STATUS_INQUIRY
        ]
    
    async def execute(
        self,
        session_id: str,
        intent: Intent,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WorkflowResult:
        """Execute patient portal workflow."""
        
        # Check if this is a patient portal session
        channel = context.get("channel")
        if channel != "patient_portal":
            # Fallback to regular workflow
            return await self._fallback_response(entities, context)
        
        patient_token = context.get("patient_token")
        if not patient_token:
            return WorkflowResult(
                success=False,
                response_text="Please log in to the patient portal to book appointments.",
                is_complete=False
            )
        
        if intent == Intent.BOOK_APPOINTMENT:
            return await self._book_appointment(entities, context, patient_token)
        elif intent in [Intent.CHECK_APPOINTMENT_STATUS, Intent.GENERAL_STATUS_INQUIRY]:
            return await self._get_appointments(entities, context, patient_token)
        elif intent == Intent.CANCEL_APPOINTMENT:
            return await self._cancel_appointment(entities, context, patient_token)
        
        return await self._fallback_response(entities, context)
    
    async def _fallback_response(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any]
    ) -> WorkflowResult:
        """Provide helpful fallback response."""
        return WorkflowResult(
            success=True,
            response_text="I can help you book appointments, view your scheduled appointments, or cancel them. What would you like to do?",
            is_complete=False,
            updated_context=context
        )
    
    async def _make_portal_request(
        self,
        method: str,
        endpoint: str,
        token: str,
        data: Dict = None
    ) -> Dict:
        """Make authenticated request to patient portal API."""
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # Use the base URL from the configured HIS Client (which points to the correct backend)
            # endpoint is expected to start with /, e.g., /appointments
            url = f"{self.his_client.base_url}/patient{endpoint}"
            
            if method == "GET":
                response = await client.get(url, headers=headers)
            elif method == "POST":
                response = await client.post(url, headers=headers, json=data)
            elif method == "PUT":
                response = await client.put(url, headers=headers, json=data)
            elif method == "DELETE":
                response = await client.delete(url, headers=headers)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            if response.status_code >= 400:
                logger.error("Portal API error",
                           status=response.status_code,
                           endpoint=endpoint,
                           response=response.text)
                raise Exception(f"API error: {response.status_code}")
            
            return response.json()
    
    async def _book_appointment(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        token: str
    ) -> WorkflowResult:
        """Book appointment through patient portal API."""
        
        workflow_state = context.get("workflow_state", {})
        
        logger.info("PORTAL: Booking appointment",
                   entities_keys=list(entities.keys()),
                   workflow_state_keys=list(workflow_state.keys()))
        
        # Step 1: Get departments if not selected
        department_id = entities.get("department_id") or workflow_state.get("department_id")
        department_name = entities.get("department") or workflow_state.get("department")
        
        if not department_id:
            # Fetch and offer departments
            try:
                result = await self._make_portal_request("GET", "/appointments/departments", token)
                departments = result.get("data", [])
                
                if departments:
                    dept_names = [d.get("name") for d in departments[:5]]
                    
                    return WorkflowResult(
                        success=True,
                        response_text=f"Which department would you like to visit? We have: {', '.join(dept_names)}.",
                        is_complete=False,
                        updated_context={
                            "step": "select_department",
                            "available_departments": departments
                        }
                    )
            except Exception as e:
                logger.error("Failed to fetch departments", error=str(e))
            
            return WorkflowResult(
                success=True,
                response_text="Which department would you like to visit? For example: General Medicine, Cardiology, or Orthopedics.",
                is_complete=False,
                updated_context={"step": "need_department"}
            )
        
        # Step 2: Get doctor if not selected
        doctor_id = entities.get("doctor_id") or workflow_state.get("doctor_id")
        doctor_name = entities.get("doctor_name") or workflow_state.get("doctor_name")
        
        if not doctor_id:
            # Fetch doctors for department
            try:
                result = await self._make_portal_request("GET", f"/appointments/doctors?departmentId={department_id}", token)
                doctors = result.get("data", [])
                
                if doctors:
                    doc_names = [f"Dr. {d.get('firstName', '')} {d.get('lastName', '')}" for d in doctors[:3]]
                    
                    return WorkflowResult(
                        success=True,
                        response_text=f"We have these doctors in {department_name}: {', '.join(doc_names)}. Who would you like to see?",
                        is_complete=False,
                        updated_context={
                            "step": "select_doctor",
                            "available_doctors": doctors,
                            "department_id": department_id,
                            "department": department_name
                        }
                    )
            except Exception as e:
                logger.error("Failed to fetch doctors", error=str(e))
                return WorkflowResult(
                    success=False,
                    response_text="I couldn't find doctors for that department. Please try again.",
                    is_complete=False
                )
        
        # Step 3: Get date and time
        preferred_date = entities.get("preferred_date") or workflow_state.get("scheduled_date")
        preferred_time = entities.get("preferred_time") or workflow_state.get("scheduled_time")
        
        if not preferred_date:
            return WorkflowResult(
                success=True,
                response_text="When would you like the appointment? You can say today, tomorrow, or a specific date (DD-MM-YYYY).",
                is_complete=False,
                updated_context={
                    "step": "need_date",
                    "department_id": department_id,
                    "department": department_name,
                    "doctor_id": doctor_id,
                    "doctor_name": doctor_name
                }
            )
        
        # Format the date
        formatted_date = self._format_date(preferred_date)
        
        if not preferred_time:
            # Fetch available slots
            try:
                result = await self._make_portal_request(
                    "GET", 
                    f"/appointments/slots?doctorId={doctor_id}&date={formatted_date}", 
                    token
                )
                slots = result.get("data", [])
                
                # Slots are {time: string, available: bool}
                available_slots = [s.get("time") for s in slots if s.get("available", True)]
                
                if available_slots:
                    slot_times = available_slots[:5]  # Show first 5 available slots
                    return WorkflowResult(
                        success=True,
                        response_text=f"Available times on {formatted_date}: {', '.join(slot_times)}. Which time works for you?",
                        is_complete=False,
                        updated_context={
                            "step": "select_time",
                            "available_slots": available_slots,
                            "scheduled_date": formatted_date,
                            "department_id": department_id,
                            "department": department_name,
                            "doctor_id": doctor_id,
                            "doctor_name": doctor_name
                        }
                    )
                else:
                    return WorkflowResult(
                        success=True,
                        response_text=f"Sorry, no slots available on {formatted_date}. Would you like to try another date?",
                        is_complete=False,
                        updated_context={
                            "step": "need_date",
                            "department_id": department_id,
                            "doctor_id": doctor_id
                        }
                    )
            except Exception as e:
                logger.error("Failed to fetch slots", error=str(e))
        
        # Step 4: Confirm and book
        is_confirmed = entities.get("confirmed") or workflow_state.get("confirmed")
        
        if not is_confirmed:
            summary = f"Let me confirm: Appointment with Dr. {doctor_name or 'your doctor'}"
            summary += f" in {department_name} on {formatted_date}"
            if preferred_time:
                summary += f" at {preferred_time}"
            summary += ". Shall I book this?"
            
            return WorkflowResult(
                success=True,
                response_text=summary,
                is_complete=False,
                updated_context={
                    "step": "awaiting_confirmation",
                    "department_id": department_id,
                    "department": department_name,
                    "doctor_id": doctor_id,
                    "doctor_name": doctor_name,
                    "scheduled_date": formatted_date,
                    "scheduled_time": preferred_time
                }
            )
        
        # Create the appointment
        try:
            logger.info("PORTAL: Creating appointment",
                       doctor_id=doctor_id,
                       department_id=department_id,
                       formatted_date=formatted_date,
                       preferred_time=preferred_time,
                       is_confirmed=is_confirmed,
                       entity_keys=list(entities.keys()))
            
            appointment_data = {
                "doctorId": doctor_id,
                "departmentId": department_id,
                "date": formatted_date,
                "time": preferred_time or "10:00",
                "notes": entities.get("notes", "Booked via Voice Assistant")
            }
            
            logger.info("PORTAL: Sending booking request", data=str(appointment_data))
            
            result = await self._make_portal_request("POST", "/appointments", token, appointment_data)
            
            appointment = result.get("data", {})
            apt_number = appointment.get("appointmentNumber", appointment.get("_id", ""))
            
            logger.info("PORTAL: Appointment booked successfully",
                       appointment_id=str(apt_number),
                       result=str(result)[:200])
            
            return WorkflowResult(
                success=True,
                response_text=f"Great! Your appointment is confirmed! Appointment ID: {apt_number}. You can view it in your appointments. Is there anything else I can help with?",
                is_complete=True,
                updated_context={"appointment": appointment}
            )
            
        except Exception as e:
            logger.error("PORTAL: Failed to book appointment", 
                        error=str(e),
                        doctor_id=doctor_id,
                        department_id=department_id,
                        date=formatted_date)
            return WorkflowResult(
                success=False,
                response_text=f"I couldn't complete the booking. Error: {str(e)[:100]}. Please try using the Book Appointment page.",
                is_complete=False,
                requires_human=False
            )
    
    async def _get_appointments(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        token: str
    ) -> WorkflowResult:
        """Get patient's appointments."""
        try:
            result = await self._make_portal_request("GET", "/appointments", token)
            appointments = result.get("data", [])
            
            if not appointments:
                return WorkflowResult(
                    success=True,
                    response_text="You don't have any appointments scheduled. Would you like to book one?",
                    is_complete=True
                )
            
            # Format upcoming appointments
            upcoming = [a for a in appointments if a.get("status") == "scheduled"]
            
            if upcoming:
                apt = upcoming[0]
                doc_name = f"Dr. {apt.get('doctor', {}).get('firstName', '')} {apt.get('doctor', {}).get('lastName', '')}"
                date = apt.get("scheduledDate", "")[:10]
                time = apt.get("scheduledTime", "")
                
                response = f"You have {len(upcoming)} upcoming appointment(s). "
                response += f"Next one is with {doc_name} on {date}"
                if time:
                    response += f" at {time}"
                response += ". Would you like to book another appointment?"
                
                return WorkflowResult(
                    success=True,
                    response_text=response,
                    is_complete=True,
                    updated_context={"appointments": appointments}
                )
            
            return WorkflowResult(
                success=True,
                response_text="All your appointments are completed. Would you like to book a new one?",
                is_complete=True
            )
            
        except Exception as e:
            logger.error("Failed to fetch appointments", error=str(e))
            return WorkflowResult(
                success=False,
                response_text="I couldn't fetch your appointments. Please check the Appointments page.",
                is_complete=False
            )
    
    async def _cancel_appointment(
        self,
        entities: Dict[str, Any],
        context: Dict[str, Any],
        token: str
    ) -> WorkflowResult:
        """Cancel an appointment."""
        # For now, direct to the UI
        return WorkflowResult(
            success=True,
            response_text="To cancel an appointment, please go to your Appointments page where you can see all your bookings and cancel any scheduled appointment.",
            is_complete=True
        )
    
    def _format_date(self, date_input: str) -> str:
        """Format date input to YYYY-MM-DD."""
        date_input_lower = date_input.lower().strip()
        
        today = datetime.now().date()
        
        if date_input_lower == "today":
            return today.isoformat()
        elif date_input_lower == "tomorrow":
            return (today + timedelta(days=1)).isoformat()
        elif "next" in date_input_lower:
            # Handle "next Monday", "next week", etc.
            return (today + timedelta(days=7)).isoformat()
        
        # Try to parse as date
        try:
            # Try common formats
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y"]:
                try:
                    parsed = datetime.strptime(date_input, fmt)
                    return parsed.date().isoformat()
                except ValueError:
                    continue
        except:
            pass
        
        # Default to tomorrow
        return (today + timedelta(days=1)).isoformat()
    
    async def continue_workflow(
        self,
        session_id: str,
        new_entities: Dict[str, Any],
        all_entities: Dict[str, Any],
        context: Dict[str, Any],
        is_confirmation: bool = False,
        is_denial: bool = False
    ) -> WorkflowResult:
        """Continue patient portal workflow."""
        
        # CRITICAL: Log that we reached PatientPortalWorkflow
        logger.info("=" * 60)
        logger.info("PORTAL: continue_workflow CALLED!",
                   session_id=session_id,
                   is_confirmation=is_confirmation)
        logger.info("=" * 60)
        
        workflow_state = context.get("workflow_state", {})
        step = workflow_state.get("step", "")
        patient_token = context.get("patient_token")
        
        logger.info("PORTAL: continue_workflow",
                   step=step,
                   is_confirmation=is_confirmation,
                   is_denial=is_denial)
        
        if not patient_token:
            return WorkflowResult(
                success=False,
                response_text="Your session has expired. Please log in again.",
                is_complete=False
            )
        
        # Merge workflow state with new entities
        merged_entities = {**workflow_state, **all_entities, **new_entities}
        
        # Handle department selection
        if step == "select_department":
            available_depts = workflow_state.get("available_departments", [])
            user_input = new_entities.get("_raw_input", "").lower()
            
            logger.info("PORTAL: Department selection", 
                       user_input=user_input,
                       available_count=len(available_depts))
            
            for dept in available_depts:
                dept_name = dept.get("name", "").lower()
                if dept_name in user_input or user_input in dept_name:
                    merged_entities["department_id"] = str(dept.get("_id"))  # Convert to string
                    merged_entities["department"] = dept.get("name")
                    logger.info("PORTAL: Department matched",
                               department=dept.get("name"),
                               department_id=merged_entities["department_id"])
                    break
        
        # Handle doctor selection
        if step == "select_doctor":
            available_docs = workflow_state.get("available_doctors", [])
            user_input = new_entities.get("_raw_input", "").lower()
            
            logger.info("PORTAL: Doctor selection",
                       user_input=user_input,
                       available_count=len(available_docs))
            
            for doc in available_docs:
                first_name = doc.get("firstName", "").lower()
                last_name = doc.get("lastName", "").lower()
                
                if first_name in user_input or last_name in user_input:
                    merged_entities["doctor_id"] = str(doc.get("_id"))  # Convert to string
                    merged_entities["doctor_name"] = f"{doc.get('firstName', '')} {doc.get('lastName', '')}"
                    logger.info("PORTAL: Doctor matched",
                               doctor_name=merged_entities["doctor_name"],
                               doctor_id=merged_entities["doctor_id"])
                    break
        
        # Handle date selection (manual fallback)
        if step == "need_date":
            user_input = new_entities.get("_raw_input", "").lower()
            if "today" in user_input:
                merged_entities["preferred_date"] = "today"
            elif "tomorrow" in user_input:
                merged_entities["preferred_date"] = "tomorrow"
            elif "next" in user_input:
                merged_entities["preferred_date"] = user_input

        # Handle time selection
        if step == "select_time":
            user_input = new_entities.get("_raw_input", "").strip()
            # Check if input looks like a time
            if ":" in user_input or any(t in user_input.lower() for t in ["am", "pm"]):
                merged_entities["preferred_time"] = user_input
            else:
                 # Try to extract simple numbers (e.g. "10" -> "10:00")
                import re
                hour_match = re.search(r'\b(\d{1,2})\b', user_input)
                if hour_match:
                    hour = int(hour_match.group(1))
                    if 1 <= hour <= 12: # Assume 9-5 range usually, but 1-12 is safe logic
                         merged_entities["preferred_time"] = f"{hour}:00"
                    elif 13 <= hour <= 23:
                         merged_entities["preferred_time"] = f"{hour}:00"
        
        # Handle confirmation
        if step == "awaiting_confirmation":
            # Check is_confirmation flag OR detect confirmation words in raw input
            raw_input = new_entities.get("_raw_input", "").lower().strip()
            confirmation_words = ["yes", "yeah", "yep", "sure", "ok", "okay", "confirm", "book", "please", "do it", "go ahead"]
            denial_words = ["no", "nope", "cancel", "stop", "don't", "not now"]
            
            is_confirmed = is_confirmation or any(word in raw_input for word in confirmation_words)
            is_denied = is_denial or any(word in raw_input for word in denial_words)
            
            logger.info("PORTAL: Confirmation check",
                       step=step,
                       raw_input=raw_input,
                       is_confirmed=is_confirmed,
                       is_denied=is_denied)
            
            if is_confirmed and not is_denied:
                merged_entities["confirmed"] = True
            elif is_denied:
                return WorkflowResult(
                    success=True,
                    response_text="No problem. Would you like to choose a different time or doctor?",
                    is_complete=False,
                    updated_context={"step": "restart"}
                )
        
        # Update context with merged entities so _book_appointment can access everything
        updated_context = {
            **context,
            "workflow_state": merged_entities
        }
        
        # Continue booking flow with properly merged context
        return await self._book_appointment(merged_entities, updated_context, patient_token)
