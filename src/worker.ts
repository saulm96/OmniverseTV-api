console.log('🔶 El worker de OmniverseTV se ha iniciado.');
console.log('Esperando trabajos de traducción en la cola...');

// Por ahora, solo mostramos un mensaje.
// En el futuro, aquí irá la lógica para conectarse a Redis y procesar trabajos.

function keepAlive() {
  setTimeout(keepAlive, 1000 * 60); // Ejecuta esta función cada minuto para mantener el proceso vivo
}

keepAlive();

