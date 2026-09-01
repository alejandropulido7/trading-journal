import pytest
from core.exceptions import AppDomainError, NotFoundError, BusinessLogicError

def test_app_domain_error_is_base_exception():
    err = AppDomainError("Custom domain error")
    assert isinstance(err, Exception)
    assert str(err) == "Custom domain error"

def test_not_found_error_properties_and_message():
    err = NotFoundError(entity_name="Account", entity_id=42)
    assert isinstance(err, AppDomainError)
    assert err.entity_name == "Account"
    assert err.entity_id == 42
    assert err.message == "Account con ID 42 no fue encontrado/a."
    assert str(err) == "Account con ID 42 no fue encontrado/a."

def test_business_logic_error_properties_and_message():
    err = BusinessLogicError("El peso total de la estrategia debe ser 100%. Actual: 80%")
    assert isinstance(err, AppDomainError)
    assert err.message == "El peso total de la estrategia debe ser 100%. Actual: 80%"
    assert str(err) == "El peso total de la estrategia debe ser 100%. Actual: 80%"
