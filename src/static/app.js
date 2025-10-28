document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  const participantsList = document.getElementById("participants-list");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Adiciona seção de participantes dentro do cartão
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>

          <div class="participants" aria-live="polite">
            <h5>Participantes</h5>
            <ul class="participants-list">
              <!-- participantes serão inseridos aqui -->
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);

        // Preenche a lista de participantes dentro do cartão
        const participantsUl = activityCard.querySelector('.participants-list');
        if (!details.participants || details.participants.length === 0) {
          const li = document.createElement('li');
          li.textContent = 'Nenhum participante ainda.';
          li.className = 'empty-participants';
          participantsUl.appendChild(li);
        } else {
          details.participants.forEach(p => {
            participantsUl.appendChild(createParticipantLi(name, p));
          });
        }
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Helper to create a participant <li> with delete button
  function createParticipantLi(activityName, email) {
    const li = document.createElement('li');
    li.className = 'participant-item';

    const span = document.createElement('span');
    span.textContent = email;

    const btn = document.createElement('button');
    btn.className = 'delete-btn';
    btn.setAttribute('aria-label', `Remove ${email} from ${activityName}`);
    btn.textContent = '✕';

    btn.addEventListener('click', async () => {
      if (!confirm(`Remover ${email} de ${activityName}?`)) return;
      try {
        const resp = await fetch(`/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`, {
          method: 'DELETE'
        });
        const result = await resp.json();
        if (resp.ok) {
          // Atualiza toda a interface para refletir mudanças
          fetchActivities();
        } else {
          alert(result.detail || 'Erro ao remover participante');
        }
      } catch (err) {
        console.error('Erro ao chamar unregister:', err);
        alert('Não foi possível remover participante. Tente novamente.');
      }
    });

    li.appendChild(span);
    li.appendChild(btn);
    return li;
  }

  // Função para exibir participantes dentro do cartão correspondente
  function displayParticipants(activityId, participants) {
    const cards = document.querySelectorAll('.activity-card');
    let targetCard = null;
    cards.forEach(card => {
      const title = card.querySelector('h4')?.textContent;
      if (title === activityId) targetCard = card;
    });
    if (!targetCard) return;

    const ul = targetCard.querySelector('.participants-list');
    ul.innerHTML = '';
    if (!participants || participants.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Nenhum participante ainda.';
      li.className = 'empty-participants';
      ul.appendChild(li);
    } else {
      participants.forEach(p => {
        ul.appendChild(createParticipantLi(activityId, p));
      });
    }
  }

  // Função para atualizar a lista de participantes (busca na API a atividade específica)
  async function updateParticipants(activityId) {
    if (!activityId) {
      participantsList.innerHTML = '';
      return;
    }
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activityId)}`);
      if (!response.ok) {
        participantsList.innerHTML = '';
        return;
      }
      const data = await response.json(); // espera { description, schedule, participants, ... }
      // Atualiza a lista lateral (existente)
      participantsList.innerHTML = '';
      if (data.participants && data.participants.length) {
        data.participants.forEach(p => {
          participantsList.appendChild(createParticipantLi(activityId, p));
        });
      } else {
        const li = document.createElement('li');
        li.className = 'empty-participants';
        li.textContent = 'Nenhum participante ainda.';
        participantsList.appendChild(li);
      }

      // Atualiza também o cartão correspondente
      displayParticipants(activityId, data.participants);
    } catch (err) {
      console.error("Erro ao atualizar participantes:", err);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Update participants list dentro do cartão usando os dados retornados
        // Atualiza toda a interface para refletir mudanças
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Chame a função updateParticipants quando uma atividade for selecionada
  activitySelect.addEventListener("change", (event) => {
    const selectedActivityId = event.target.value;
    updateParticipants(selectedActivityId);
  });

  // Initialize app
  fetchActivities();
});
