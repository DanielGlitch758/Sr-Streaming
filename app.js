import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// --- 1. CONFIGURACIÓN ---
const firebaseConfig = {
    apiKey: "AIzaSyCwND4K2tKyQD37R_Gt160PwskGNs-1LhU",
    authDomain: "sr-streaming-e13ac.firebaseapp.com",
    projectId: "sr-streaming-e13ac",
    storageBucket: "sr-streaming-e13ac.firebasestorage.app",
    messagingSenderId: "779948636138",
    appId: "1:779948636138:web:5ceaf4ce15caa88d5d6493",
    measurementId: "G-FLRJFC21L3"
};

// --- 2. INICIALIZACIÓN ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- 3. SEGURIDAD (EL GUARDIA) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Sesión activa: ", user.email);
        const userDisplay = document.getElementById('userEmailDisplay');
        if(userDisplay) userDisplay.innerText = "Sr. Daniel"; 
    } else {
        window.location.href = "login.html";
    }
});

window.cerrarSesion = function() {
    signOut(auth).then(() => {
        alert("Sesión cerrada. ¡Hasta pronto!");
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Error al salir", error);
    });
}

// --- 4. REFERENCIAS DEL DOM ---
const formVenta = document.getElementById('formVenta');
const formCliente = document.getElementById('formCliente');
const selectCliente = document.getElementById('selectCliente');

// --- 5. GESTIÓN DE CLIENTES ---

async function cargarClientes() {
    const q = query(collection(db, "clientes"), orderBy("nombre"));
    const querySnapshot = await getDocs(q);
    
    selectCliente.innerHTML = '<option value="">Selecciona un cliente...</option>';
    
    const listaClientesDiv = document.getElementById('listaClientes');
    if(listaClientesDiv) listaClientesDiv.innerHTML = '';

    querySnapshot.forEach((doc) => {
        const cliente = doc.data();
        
        // CORRECCIÓN AQUÍ: Usamos 'telefono' en lugar de 'tel' para que coincida
        const clienteObj = { 
            nombre: cliente.nombre, 
            telefono: cliente.telefono || "Sin registro" // Seguro contra undefined
        };

        const option = document.createElement("option");
        option.value = JSON.stringify(clienteObj); 
        option.text = cliente.nombre;
        selectCliente.appendChild(option);

        if(listaClientesDiv) {
            const card = `
                <div class="p-4 border rounded-lg hover:shadow-md transition bg-gray-50">
                    <div class="flex justify-between items-start">
                        <div>
                            <h4 class="font-bold text-gray-800">${cliente.nombre}</h4>
                            <p class="text-sm text-gray-500"><i class="fab fa-whatsapp text-green-500"></i> ${cliente.telefono || 'Sin tel'}</p>
                        </div>
                        <a href="https://wa.me/${cliente.telefono}" target="_blank" class="p-2 bg-green-100 text-green-600 rounded-full hover:bg-green-200">
                            <i class="fas fa-comment-dots"></i>
                        </a>
                    </div>
                </div>`;
            listaClientesDiv.innerHTML += card;
        }
    });
}

if(formCliente) {
    formCliente.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombre = document.getElementById('nuevoClienteNombre').value;
        const telefono = document.getElementById('nuevoClienteTel').value;

        try {
            await addDoc(collection(db, "clientes"), { nombre, telefono, fechaRegistro: new Date() });
            alert("Cliente guardado correctamente");
            document.getElementById('modalCliente').classList.add('hidden');
            formCliente.reset();
            cargarClientes(); 
        } catch (error) {
            console.error("Error: ", error);
            alert("Error al guardar cliente");
        }
    });
}

// --- 6. GESTIÓN DE VENTAS ---

if(formVenta) {
    formVenta.addEventListener('submit', async (e) => {
        e.preventDefault();

        const esStreaming = !document.getElementById('camposStreaming').classList.contains('hidden');
        
        // Obtener datos del cliente seleccionado
        const clienteData = JSON.parse(selectCliente.value || "{}");
        if(!clienteData.nombre) { alert("Selecciona un cliente"); return; }

        let nuevaVenta = {
            cliente: clienteData.nombre,
            // CORRECCIÓN AQUÍ: Aseguramos que nunca sea undefined
            telefono: clienteData.telefono || "Sin registro", 
            fechaVenta: new Date().toISOString(),
            tipoVenta: esStreaming ? 'streaming' : 'cine'
        };

        if (esStreaming) {
            const costo = parseFloat(document.getElementById('streamCosto').value) || 0;
            const precio = parseFloat(document.getElementById('streamPrecio').value) || 0;
            
            nuevaVenta.servicio = document.getElementById('streamPlataforma').value; 
            nuevaVenta.detalle = document.getElementById('streamTipo').value;
            nuevaVenta.vencimiento = document.getElementById('streamVencimiento').value;
            nuevaVenta.costo = costo;
            nuevaVenta.precio = precio;
            nuevaVenta.ganancia = precio - costo;

        } else {
            const precioReal = parseFloat(document.getElementById('cinePrecioReal').value) || 0;
            
            nuevaVenta.servicio = "Cinépolis";
            nuevaVenta.detalle = document.getElementById('cineDetalle').value;
            nuevaVenta.vencimiento = "N/A"; 
            
            nuevaVenta.precio = precioReal * 0.50; 
            nuevaVenta.costo = precioReal * 0.30; 
            nuevaVenta.ganancia = precioReal * 0.20; 
        }

        try {
            await addDoc(collection(db, "ventas"), nuevaVenta);
            alert(`¡Venta de ${nuevaVenta.servicio} registrada! Ganancia: $${nuevaVenta.ganancia}`);
            document.getElementById('modalVenta').classList.add('hidden');
            formVenta.reset();
            cargarVentas(); 
        } catch (error) {
            console.error("Error venta: ", error);
            alert("Hubo un error al registrar la venta (Revisa la consola)");
        }
    });
}

// Cargar Ventas en Dashboard
async function cargarVentas() {
    if(!document.getElementById('tablaVentasBody')) return;

    const q = query(collection(db, "ventas"), orderBy("fechaVenta", "desc"));
    const querySnapshot = await getDocs(q);
    
    let totalGanancia = 0;
    let cuentasActivas = 0;
    let cuentasPorVencer = 0;
    const tablaBody = document.getElementById('tablaVentasBody');
    tablaBody.innerHTML = '';

    const hoy = new Date();

    querySnapshot.forEach((doc) => {
        const venta = doc.data();
        totalGanancia += (venta.ganancia || 0); // Evitar NaN si falta el dato

        let estadoHTML = '';
        let colorFila = '';
        
        if(venta.tipoVenta === 'streaming') {
            const fechaVenc = new Date(venta.vencimiento);
            const diferenciaDias = Math.ceil((fechaVenc - hoy) / (1000 * 60 * 60 * 24));
            
            if (diferenciaDias > 0) cuentasActivas++;
            
            if (diferenciaDias < 0) {
                estadoHTML = `<span class="px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs">Vencida</span>`;
            } else if (diferenciaDias <= 3) {
                cuentasPorVencer++;
                estadoHTML = `<span class="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">⚠ ${diferenciaDias} días</span>`;
                colorFila = 'bg-red-50'; 
            } else if (diferenciaDias <= 7) {
                estadoHTML = `<span class="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">⏳ ${diferenciaDias} días</span>`;
            } else {
                estadoHTML = `<span class="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">Activa</span>`;
            }
        } else {
            estadoHTML = `<span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs">Cine</span>`;
        }

        const fila = `
            <tr class="border-b hover:bg-gray-50 ${colorFila}">
                <td class="p-4">
                    <div class="font-bold text-gray-800">${venta.cliente}</div>
                    <div class="text-xs text-gray-400">${venta.telefono || ''}</div>
                </td>
                <td class="p-4">
                    <div class="flex items-center gap-2">
                        ${venta.servicio === 'Netflix' ? '<span class="text-red-600 font-bold">N</span>' : 
                          venta.servicio === 'Cinépolis' ? '<span class="text-blue-800 font-bold">C</span>' : 
                          '<span class="text-blue-500">●</span>'}
                        ${venta.servicio}
                    </div>
                    <div class="text-xs text-gray-500">${venta.detalle}</div>
                </td>
                <td class="p-4">
                    <div class="text-sm">${venta.vencimiento !== 'N/A' ? venta.vencimiento : new Date(venta.fechaVenta).toLocaleDateString()}</div>
                    <div class="mt-1">${estadoHTML}</div>
                </td>
                <td class="p-4 font-bold text-green-600">+$${(venta.ganancia || 0).toFixed(0)}</td>
                <td class="p-4 text-center">
                    <button onclick="copiarDatos('${venta.servicio}', '${venta.cliente}', '${venta.vencimiento}')" class="text-gray-400 hover:text-blue-600" title="Copiar datos para WhatsApp">
                        <i class="far fa-copy"></i>
                    </button>
                </td>
            </tr>
        `;
        tablaBody.innerHTML += fila;
    });

    if(document.getElementById('statGanancia')) {
        document.getElementById('statGanancia').innerText = `$${totalGanancia.toFixed(0)}`;
        document.getElementById('statActivas').innerText = cuentasActivas;
        document.getElementById('statVencimientos').innerText = cuentasPorVencer;
    }
}

window.copiarDatos = function(servicio, cliente, vencimiento) {
    const texto = `Hola ${cliente} 👋\nAquí tienes los datos de tu servicio ${servicio}.\nVencimiento: ${vencimiento}\n¡Gracias por tu compra en Sr. Stream!`;
    navigator.clipboard.writeText(texto).then(() => {
        alert("Mensaje copiado al portapapeles. Listo para pegar en WhatsApp.");
    });
}

cargarClientes();
cargarVentas();
console.log("🔥 Sistema Sr. Stream v2.2 (Depurado) Iniciado");
