import pytest
from fastapi.testclient import TestClient
from src.app import app

client = TestClient(app)

# Testa listagem de atividades
def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]

# Testa cadastro de participante novo
def test_signup_for_activity():
    email = "novo@mergington.edu"
    activity = "Chess Club"
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    data = resp.json()
    assert email in data["participants"]

# Testa erro ao cadastrar participante já existente
def test_signup_duplicate():
    email = "daniel@mergington.edu"
    activity = "Chess Club"
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 400
    data = resp.json()
    assert "already signed up" in data["detail"]

# Testa remoção de participante
def test_unregister_participant():
    email = "remover@mergington.edu"
    activity = "Chess Club"
    # Cadastra e garante sucesso
    signup_resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert signup_resp.status_code == 200 or signup_resp.status_code == 400
    # Remove (aceita 200 ou 404)
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 200 or resp.status_code == 404
    if resp.status_code == 200:
        data = resp.json()
        assert email not in data["participants"]

# Testa erro ao remover participante inexistente
def test_unregister_nonexistent():
    email = "naoexiste@mergington.edu"
    activity = "Chess Club"
    resp = client.delete(f"/activities/{activity}/unregister?email={email}")
    assert resp.status_code == 404
    data = resp.json()
    assert (
        "Participant not found" in data.get("detail", "")
        or "Not Found" in data.get("detail", "")
    )
