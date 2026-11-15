/* Fuente de desarrollo: datos ficticios generados en el navegador.
 * No hace ninguna petición de red. Los identificadores empiezan por OB9 y no existen en ningún sistema.
 */
(function (g) {
  "use strict";
  function iso(d) { return d.toISOString().slice(0, 10); }
  function dia(base, n) { var d = new Date(base.getTime()); d.setUTCDate(d.getUTCDate() + n); return iso(d); }
  function hoyMadrid() {
    try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
    catch (e) { return iso(new Date()); }
  }
  // Generador pseudoaleatorio con semilla fija: los mismos datos en cada carga.
  function azar(semilla) { var s = semilla >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

  var TIPOS = ["Instalación Split", "Instalación Conductos", "Instalación Máquina Aerotermia", "Puesta en Servicio Aerotermia", "Visita", "Albañilería", "Validación OPS Cliente"];
  var PMOS = ["Ficticio 1", "Ficticio 2", "Ficticio 3"];
  var FRANJAS = ["MORNING", "AFTERNOON", "FULL_DAY"];

  function construye() {
    var h = hoyMadrid(), base = new Date(h + "T00:00:00Z"), r = azar(20261115);
    var pick = function (a) { return a[Math.floor(r() * a.length)]; };
    var ag = [], al = [], fichas = {}, n = 1;
    function so() { return "OB9" + String(n++).padStart(5, "0"); }
    for (var d = 0; d < 4; d++) {
      for (var j = 0; j < 4 + d % 2; j++) {
        var s = so(), largo = j === 0 ? 2 : 0;
        var x = { iid: "DEMO-" + s, so: s, tipo: pick(TIPOS), estado: j % 4 === 3 ? "SCHEDULED" : "CONFIRMED",
          desde: dia(base, d), hasta: dia(base, d + largo), franja: pick(FRANJAS), hIni: j % 2 ? "" : (j === 0 ? "08:30" : "10:00"),
          instalador: j === 2 ? "" : "Instalador ficticio " + (1 + Math.floor(r() * 5)), conInstalador: j !== 2,
          cliente: "Cliente ficticio " + s.slice(-3), ciudad: "Ciudad ficticia " + "ABCD"[j % 4], pmo: PMOS[(d + j) % 3], incidencia: j === 1 && d === 1 };
        ag.push(x);
        fichas[s] = { so: s, cliente: x.cliente, ciudad: x.ciudad, tipoObra: "Tipo de obra ficticio", estadoSo: "SCHEDULED", pmo: x.pmo, incidencia: x.incidencia, intervenciones: [x] };
      }
    }
    for (var k = 0; k < 18; k++) {
      var s2 = so(), enA = k % 3 !== 2, enB = k % 2 === 0, enC = k === 4 || k === 11;
      var a = [], b = [], c = [];
      if (enA) a.push({ estado: k % 4 === 0 ? "OVERDUE" : "CONFIRMED", tipo: pick(TIPOS), fin: dia(base, -(1 + k * 3)), conInstalador: k % 5 !== 0 });
      if (enB) { b.push({ estado: "QUALIFIED", tipo: pick(TIPOS), fin: "", conInstalador: false }); if (enA) b.push(a[0]); }
      if (k === 6) { enB = true; b = [{ estado: "SCHEDULED", tipo: "Albañilería", fin: "", conInstalador: false }]; } // fuera de la regla B
      if (enC) c = [{ estado: "COMPLETED", fin: dia(base, -(5 + k)) }, { estado: "VALIDATED", fin: "" }];
      al.push({ so: s2, pmo: PMOS[k % 3], estadoSo: k % 2 ? "SCHEDULED" : "TO_BE_SCHEDULED", ticketCierre: k === 11,
        diasUltimoCierre: k % 7 === 6 ? null : 2 + k * 2, enA: enA, enB: enB, enC: enC, a: a, b: b, c: c });
      fichas[s2] = { so: s2, cliente: "Cliente ficticio " + s2.slice(-3), ciudad: "Ciudad ficticia B", tipoObra: "Tipo de obra ficticio", estadoSo: k % 2 ? "SCHEDULED" : "TO_BE_SCHEDULED", pmo: PMOS[k % 3], incidencia: enC, intervenciones: [] };
    }
    return { ag: ag, al: al, fichas: fichas };
  }
  var D = null;
  function datos() { return D || (D = construye()); }
  function espera(v) { return new Promise(function (ok) { setTimeout(function () { ok(v); }, 120); }); }

  g.HoyObras = g.HoyObras || {};
  g.HoyObras.fuenteDemo = {
    id: "demo",
    rotulo: "MODO DESARROLLO · DATOS FICTICIOS · sin conexión a sistemas reales",
    enVivo: false,
    agenda: function (p) {
      var f = datos().ag.filter(function (x) { return x.desde <= p.hasta && x.hasta >= p.desde; });
      return espera({ leidoEn: Date.now(), filas: f });
    },
    alertas: function () { return espera({ leidoEn: Date.now(), filas: datos().al }); },
    ficha: function (so) { return espera({ leidoEn: Date.now(), ficha: datos().fichas[so] || null }); }
  };
})(window);
