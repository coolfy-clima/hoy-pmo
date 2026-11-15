/* Fuente «servidor»: conexión a servidor. NO IMPLEMENTADA.
 *
 * No hay ningún endpoint, URL, clave ni permiso inventado aquí. Cada método
 * falla con un error que lista lo que falta.
 *
 * Lo que debería hacer cuando exista el servidor:
 *  - enviar la identidad verificada de la persona (sesión del proveedor que se decida),
 *    nunca una clave fija ni una contraseña guardada en el navegador;
 *  - pedir operaciones con nombre (agenda, alertas, ficha), nunca SQL libre;
 *  - recibir solo lo que esa persona tiene permitido, ya filtrado en el servidor;
 *  - pedir respuestas con «Cache-Control: no-store».
 */
(function (g) {
  "use strict";
  var FALTA = [
    "Servidor o función que exponga agenda, alertas y ficha en solo lectura (no existe)",
    "Proveedor de identidad con correo verificado (no decidido)",
    "Lista de personas autorizadas y su alcance, aplicada en el servidor (pendiente)",
    "Credencial de servicio guardada solo en el servidor (no existe)"
  ];
  function noConfigurada() {
    var e = new Error("Fuente «servidor» no configurada. Falta: " + FALTA.join("; ") + ".");
    e.code = "no_configurada";
    return Promise.reject(e);
  }
  g.HoyObras = g.HoyObras || {};
  g.HoyObras.fuenteServidor = {
    id: "servidor",
    rotulo: "Conexión independiente NO CONFIGURADA",
    enVivo: false,
    falta: FALTA,
    agenda: noConfigurada,
    alertas: noConfigurada,
    ficha: noConfigurada
  };
})(window);
