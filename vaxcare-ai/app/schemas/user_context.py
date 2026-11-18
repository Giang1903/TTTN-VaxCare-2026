from pydantic import BaseModel, Field


class VaccinationRecord(BaseModel):
    vaccine_id: int | None = None
    vaccine_name: str | None = None
    dose_number: int | None = None
    injection_date: str | None = None
    result: str | None = None


class UserContext(BaseModel):
    user_id: int | None = None
    full_name: str | None = None
    date_of_birth: str | None = None
    age_years: float | None = None
    age_months: int | None = None
    records: list[VaccinationRecord] = Field(default_factory=list)
