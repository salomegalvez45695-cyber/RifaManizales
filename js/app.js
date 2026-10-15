// Configuración de Firebase Clásico
const firebaseConfig = {
  apiKey: "AIzaSyC_S4uCywRNId56vc280wLf_4oon4eStE",
  authDomain: "rifamanizales.firebaseapp.com",
  projectId: "rifamanizales",
  storageBucket: "rifamanizales.appspot.com",
  messagingSenderId: "332844895729",
  appId: "1:332844895729:web:c39c4e0c2b6e2df9170850"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let selectedNumber = null;
const modal = document.getElementById('modal');
const modalNum = document.getElementById('modal-num');
const reserveForm = document.getElementById('reserve-form');

// Abrir el modal al hacer clic en un número
window.openModal = function(numStr) {
  selectedNumber = numStr;
  modalNum.textContent = `#${numStr}`;
  if (modal) modal.style.display = 'flex';
};

// Cerrar el modal
window.closeModal = function() {
  if (modal) modal.style.display = 'none';
  if (reserveForm) reserveForm.reset();
};

// -----------------------------------------------------------
// VISTA PRINCIPAL (index.html)
// -----------------------------------------------------------
function initIndexPage() {
  const grid = document.getElementById('grid');
  if (!grid) return;

  // Escuchar cambios en tiempo real desde Firestore
  db.collection("boletas").onSnapshot((snapshot) => {
    // 1. Primero resetemos todos los botones a su estado disponible por defecto
    for (let i = 0; i < 100; i++) {
      const numStr = i.toString().padStart(2, '0');
      const btn = document.getElementById(`btn-${numStr}`);
      if (btn) {
        btn.className = 'number-btn';
        btn.disabled = false;
      }
    }

    // 2. Luego aplicamos los estados ocupados o pagados que vengan de la base de datos
    snapshot.forEach((doc) => {
      const numStr = doc.id;
      const data = doc.data();
      const btn = document.getElementById(`btn-${numStr}`);
      if (btn) {
        btn.classList.add(data.estado); // 'reserved' o 'paid'
        btn.disabled = true; // Desactivar para que no lo elijan dos veces
      }
    });
  });

  if (reserveForm) {
    reserveForm.onsubmit = async (e) => {
      e.preventDefault();
      const nombre = document.getElementById('nombre').value.trim();
      const telefono = document.getElementById('telefono').value.trim();

      try {
        await db.collection("boletas").doc(selectedNumber).set({
          nombre: nombre,
          telefono: telefono,
          estado: 'reserved',
          fecha: new Date().toISOString()
        });

        alert(`¡El número #${selectedNumber} ha sido reservado con éxito!`);
        closeModal();
      } catch (err) {
        console.error("Error al guardar:", err);
        alert("Hubo un error al guardar en la base de datos.");
      }
    };
  }
}

// -----------------------------------------------------------
// PANEL DE ADMINISTRACIÓN (admin.html)
// -----------------------------------------------------------
function initAdminPage() {
  const tableBody = document.getElementById('admin-table');
  if (!tableBody) return;

  db.collection("boletas").onSnapshot((snapshot) => {
    tableBody.innerHTML = '';

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#777; padding: 20px;">No hay números apartados todavía.</td></tr>`;
      return;
    }

    const docs = [];
    snapshot.forEach(docSnap => docs.push({ id: docSnap.id, ...docSnap.data() }));
    docs.sort((a, b) => a.id.localeCompare(b.id));

    docs.forEach(data => {
      const numStr = data.id;
      const row = document.createElement('tr');

      row.innerHTML = `
        <td><strong>#${numStr}</strong></td>
        <td>${data.nombre || 'N/A'}</td>
        <td><a href="https://wa.me/57${data.telefono}" target="_blank" style="color:var(--gold); text-decoration:none;">${data.telefono || 'N/A'} 💬</a></td>
        <td><span class="badge ${data.estado}">${data.estado === 'reserved' ? 'Apartado' : 'Pagado'}</span></td>
        <td>
          ${data.estado === 'reserved' ? `<button class="btn-action btn-pay" id="pay-${numStr}">Confirmar Pago</button>` : ''}
          <button class="btn-action btn-free" id="free-${numStr}">Liberar</button>
        </td>
      `;
      tableBody.appendChild(row);

      if (data.estado === 'reserved') {
        const payBtn = document.getElementById(`pay-${numStr}`);
        if (payBtn) {
          payBtn.onclick = async () => {
            await db.collection("boletas").doc(numStr).update({ estado: 'paid' });
          };
        }
      }

      const freeBtn = document.getElementById(`free-${numStr}`);
      if (freeBtn) {
        freeBtn.onclick = async () => {
          if (confirm(`¿Segura que deseas liberar el número #${numStr}?`)) {
            await db.collection("boletas").doc(numStr).delete();
          }
        };
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initIndexPage();
  initAdminPage();
});