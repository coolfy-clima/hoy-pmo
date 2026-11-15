/* Contrato de datos de la demo.
 *
 * La interfaz solo habla con un objeto «fuente» que cumple este contrato.
 * Ninguna fuente decide permisos en el navegador: lo que devuelve ya debe venir
 * filtrado por el servidor según la persona identificada.
 *
 * fuente = {
 *   id: "demo" | "servidor",
 *   rotulo: texto que la interfaz muestra siempre en la cabecera,
 *   enVivo: true solo si lee el sistema real en ese momento,
 *   agenda({ desde, hasta })  -> Promise<{ leidoEn, filas: Intervencion[] }>
 *   alertas()                 -> Promise<{ leidoEn, filas: AlertaSO[] }>
 *   ficha(so)                 -> Promise<{ leidoEn, ficha: Ficha | null }>
 * }
 *
 * Intervencion = { iid, so (identificador de obra), tipo, estado, desde, hasta, franja, hIni, instalador,
 *                  conInstalador, cliente, ciudad, pmo, incidencia }
 *   fechas en ISO (AAAA-MM-DD); estado con códigos fijos
 *   (QUALIFIED, SCHEDULED, CONFIRMED, IN_PROGRESS, OVERDUE, COMPLETED, VALIDATED).
 *
 * AlertaSO = { so, pmo, estadoSo, ticketCierre, diasUltimoCierre,
 *              enA, enB, enC,
 *              a: [{ estado, tipo, fin, conInstalador }],   // pasos con fecha pasada sin cerrar
 *              b: [{ estado, tipo, fin, conInstalador }],   // pasos pendientes de la obra (fin "" si sin fecha)
 *              c: [{ estado, fin }] }                      // intervenciones de incidencia
 *   La interfaz recalcula B: solo cuenta si hay algún paso QUALIFIED sin fecha.
 *
 * Ficha = { so, cliente, ciudad, tipoObra, estadoSo, pmo, incidencia,
 *           intervenciones: Intervencion[] }
 *   Teléfono, dirección e importe no forman parte del contrato hasta que se
 *   decida quién puede verlos (pendiente de decisión).
 */
(function (g) {
  "use strict";
  var ESTADOS = ["QUALIFIED", "SCHEDULED", "CONFIRMED", "IN_PROGRESS", "OVERDUE", "COMPLETED", "VALIDATED", "CANCELLED"];
  function esFecha(v) { return v === "" || v == null || /^\d{4}-\d{2}-\d{2}$/.test(v); }
  function compruebaFuente(f) {
    var falta = ["id", "rotulo", "agenda", "alertas", "ficha"].filter(function (k) { return !(k in f); });
    if (falta.length) throw new Error("Fuente incompleta: falta " + falta.join(", "));
    return f;
  }
  function compruebaIntervencion(x) {
    if (!/^OB9\d{5}$/.test(x.so)) throw new Error("Identificador no válido");
    if (ESTADOS.indexOf(x.estado) < 0) throw new Error("Estado desconocido: " + x.estado);
    if (!esFecha(x.desde) || !esFecha(x.hasta)) throw new Error("Fecha no válida en " + x.so);
    return x;
  }
  g.HoyObras = g.HoyObras || {};
  g.HoyObras.contrato = { ESTADOS: ESTADOS, compruebaFuente: compruebaFuente, compruebaIntervencion: compruebaIntervencion };
})(window);
