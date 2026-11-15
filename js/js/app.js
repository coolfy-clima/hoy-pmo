/* Interfaz de la demo «Hoy Obras». Sin dependencias externas ni llamadas de red. */
(function (g) {
  "use strict";
  var H = g.HoyObras;
  var VERSION = "0.3.0";
  var EST = { QUALIFIED: ["Pendiente de planificar", ""], SCHEDULED: ["Pendiente de confirmar", "wa"], CONFIRMED: ["Confirmada", "ok"], IN_PROGRESS: ["En curso", "in"], OVERDUE: ["Rezagada", "ba"], COMPLETED: ["Realizada", "in"], VALIDATED: ["Validada", ""], CANCELLED: ["Cancelada", ""] };
  var EST_SO = { TO_BE_SCHEDULED: "Por planificar", SCHEDULED: "Planificada", IN_PROGRESS: "En curso", COMPLETED: "Realizada", VALIDATED: "Validada" };
  var FR = { MORNING: "Mañana", AFTERNOON: "Tarde", FULL_DAY: "Día completo" };
  var DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"], MES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  var S = { fuente: null, tab: "agenda", pmo: "", ag: null, al: null, err: null, leido: null, cargando: false, ver: {} };
  var $ = function (id) { return document.getElementById(id); };

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function hoy() { try { return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function suma(iso, n) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
  function difDias(a, b) { return Math.round((new Date(a + "T00:00:00Z") - new Date(b + "T00:00:00Z")) / 864e5); }
  function larga(iso) { var d = new Date(iso + "T00:00:00Z"); return DIAS[d.getUTCDay()] + " " + d.getUTCDate() + " " + MES[d.getUTCMonth()]; }
  function corta(iso) { if (!iso) return "sin fecha"; var d = new Date(iso + "T00:00:00Z"); return d.getUTCDate() + " " + MES[d.getUTCMonth()] + " " + String(d.getUTCFullYear()).slice(2); }
  function hora(ms) { try { return new Intl.DateTimeFormat("es-ES", { timeZone: "Europe/Madrid", hour: "2-digit", minute: "2-digit" }).format(new Date(ms)); } catch (e) { return ""; } }
  function pill(e) { var x = EST[e] || [e, ""]; return '<span class="pill ' + x[1] + '">' + esc(x[0]) + "</span>"; }
  function mio(x) { return !S.pmo || x.pmo === S.pmo; }
  function inst(f) { return f ? "instalador asignado" : "sin instalador asignado"; }

  /* Reglas de prueba (sin validar). B solo cuenta si hay algún paso «pendiente de planificar» sin fecha. */
  function normalizaAlertas(filas) {
    return filas.map(function (r) {
      var nf = (r.b || []).filter(function (x) { return x.estado === "QUALIFIED" && !x.fin; });
      r.enB = !!r.enB && nf.length > 0;
      return r;
    }).filter(function (r) { return r.enA || r.enB || r.enC; });
  }

  function banda() {
    var b = $("banda"), f = S.fuente;
    if (!f) { b.textContent = "Sin fuente de datos"; b.className = "banda mal"; return; }
    b.textContent = f.rotulo + " · v" + VERSION;
    b.className = "banda" + (f.id === "servidor" ? " mal" : (f.enVivo ? " vivo" : ""));
  }
  function estado() {
    var t;
    if (S.cargando) t = "Leyendo…";
    else if (S.err) t = "No se ha podido leer.";
    else if (S.leido) t = (S.fuente.enVivo ? "Leído a las " : "Datos ficticios generados a las ") + hora(S.leido) + ". Solo lectura.";
    else t = "—";
    $("estado").textContent = t;
    $("btn-leer").disabled = S.cargando;
  }
  function rellenaPmo() {
    var v = {};
    (S.ag || []).forEach(function (x) { if (x.pmo) v[x.pmo] = 1; });
    (S.al || []).forEach(function (x) { if (x.pmo) v[x.pmo] = 1; });
    var sel = $("sel-gestor"), cur = S.pmo;
    sel.innerHTML = '<option value="">Todos</option>' + Object.keys(v).sort().map(function (p) { return '<option value="' + esc(p) + '">' + esc(p) + "</option>"; }).join("");
    sel.value = v[cur] ? cur : ""; S.pmo = sel.value;
  }
  function mas(clave, lista, fn, paso) {
    paso = paso || 12; var n = S.ver[clave] || paso, h = lista.slice(0, n).map(fn).join("");
    if (lista.length > n) h += '<button type="button" class="btn mas" data-mas="' + clave + '">Ver ' + Math.min(paso, lista.length - n) + " más de " + (lista.length - n) + "</button>";
    return h;
  }

  function vAgenda() {
    var h0 = hoy(), dias = [h0, suma(h0, 1), suma(h0, 2), suma(h0, 3)], html = "";
    dias.forEach(function (d, i) {
      var L = S.ag.filter(function (x) { return x.desde <= d && x.hasta >= d && mio(x); });
      var nombre = i === 0 ? "Hoy" : (i === 1 ? "Mañana" : larga(d));
      html += '<section class="sec" id="dia-' + i + '"><h2>' + esc(nombre) + "<small>" + (i < 2 ? esc(larga(d)) + " · " : "") + L.length + "</small></h2>";
      if (!L.length) html += '<div class="vacio">Sin intervenciones registradas este día. No significa que haya disponibilidad.</div>';
      html += mas("d" + i, L, function (x) {
        var cls = (EST[x.estado] || ["", ""])[1];
        var varios = x.desde !== x.hasta ? '<span class="pill">Día ' + (difDias(d, x.desde) + 1) + " de " + (difDias(x.hasta, x.desde) + 1) + "</span>" : "";
        return '<button type="button" class="card ' + cls + '" data-so="' + esc(x.so) + '"><span class="l1"><span>' + esc(x.hIni || FR[x.franja] || "Sin franja") + "</span>" + pill(x.estado) + '</span><span class="t">' + esc(x.tipo) + '</span><span class="m">' + esc(x.cliente || "") + (x.ciudad ? " · " + esc(x.ciudad) : "") + '</span><span class="m">' + (x.instalador ? esc(x.instalador) : inst(x.conInstalador)) + " · Gestor " + esc(x.pmo || "sin asignar") + " · " + esc(x.so) + '</span><span class="tags">' + varios + (x.incidencia ? '<span class="pill ba">Marca de incidencia</span>' : "") + "</span></button>";
      });
      html += "</section>";
    });
    return html;
  }
  function paso(x, conFecha) { return '<span class="m">' + esc(x.tipo) + " " + pill(x.estado) + (conFecha ? " · fin " + esc(corta(x.fin)) + " · hace " + difDias(hoy(), x.fin) + " días" : "") + " · " + inst(x.conInstalador) + "</span>"; }
  function vAlertas() {
    var V = S.al.filter(mio), A = V.filter(function (r) { return r.enA; }), B = V.filter(function (r) { return r.enB; });
    var ambas = V.filter(function (r) { return r.enA && r.enB; }).length, total = V.filter(function (r) { return r.enA || r.enB; }).length;
    var h = '<div class="kpis"><div class="k"><b>' + total + '</b><span>SO únicas con A o B</span></div><div class="k"><b>' + ambas + '</b><span>SO en A y en B</span></div><div class="k"><b>' + (A.length - ambas) + '</b><span>Solo A</span></div><div class="k"><b>' + (B.length - ambas) + "</b><span>Solo B</span></div></div>";
    h += '<p class="exp">Reglas de prueba, sin validar. Muestran lo registrado, no lo confirmado en obra, ni la necesidad real de los trabajos ni el desempeño de nadie.</p>';
    h += '<section class="sec"><h2>A · Citas pasadas sin cerrar<small>' + A.length + ' SO</small></h2><p class="exp">Intervención sin cerrar con fecha de fin pasada, en obra con ticket fuera de las etapas tratadas como cierre. Agrupado por SO.</p>';
    h += mas("a", A, function (r) {
      var ov = r.a.filter(function (x) { return x.estado === "OVERDUE"; }), ot = r.a.filter(function (x) { return x.estado !== "OVERDUE"; });
      return '<button type="button" class="card ba" data-so="' + esc(r.so) + '"><span class="l1"><span class="t">' + esc(r.so) + " · Gestor " + esc(r.pmo || "sin asignar") + "</span>" + (r.enB ? '<span class="pill">también en B</span>' : "") + "</span>" + (ov.length ? '<span class="m"><b>Rezagadas (' + ov.length + ")</b></span>" + ov.map(function (x) { return paso(x, true); }).join("") : "") + (ot.length ? '<span class="m"><b>Otras con fecha pasada (' + ot.length + ")</b></span>" + ot.map(function (x) { return paso(x, true); }).join("") : "") + "</button>";
    }) + "</section>";
    h += '<section class="sec"><h2>B · Obra empezada sin próxima cita<small>' + B.length + ' SO</small></h2><p class="exp">Obra abierta con trabajo hecho o en curso, nada pendiente con fecha de hoy en adelante y al menos un paso «pendiente de planificar» sin fecha. No se sabe si cada paso hace falta en esa obra.</p>';
    h += mas("b", B, function (r) {
      var nf = r.b.filter(function (x) { return x.estado === "QUALIFIED" && !x.fin; }), fuera = r.b.filter(function (x) { return x.estado !== "QUALIFIED" && !x.fin; });
      return '<button type="button" class="card wa" data-so="' + esc(r.so) + '"><span class="l1"><span class="t">' + esc(r.so) + " · Gestor " + esc(r.pmo || "sin asignar") + "</span>" + (r.enA ? '<span class="pill">también en A</span>' : "") + '</span><span class="m">Obra ' + esc(EST_SO[r.estadoSo] || r.estadoSo) + " · último trabajo cerrado: " + (r.diasUltimoCierre == null ? "sin fecha registrada" : "hace " + r.diasUltimoCierre + " días") + "</span>" + nf.map(function (x) { return '<span class="m">' + esc(x.tipo) + " · sin fecha · " + inst(x.conInstalador) + "</span>"; }).join("") + (fuera.length ? '<span class="m">Fuera de la regla: ' + fuera.map(function (x) { return esc(x.tipo) + " (" + esc((EST[x.estado] || [x.estado])[0].toLowerCase()) + ")"; }).join(", ") + "</span>" : "") + "</button>";
    }) + "</section>";
    return h;
  }
  function vDatos() {
    var C = S.al.filter(function (r) { return r.enC && mio(r); });
    var h = '<section class="sec"><h2>Comprobación de datos<small>' + C.length + ' SO</small></h2><p class="exp">No es una alerta operativa ni cuenta en el total. SO con la marca de incidencia activa y ninguna intervención de incidencia abierta. No indica si la incidencia está resuelta ni si queda algo por atender. SIN RESOLVER: quién mantiene la marca y cuándo debe quitarse.</p>';
    h += mas("c", C, function (r) {
      return '<button type="button" class="card" data-so="' + esc(r.so) + '"><span class="t">' + esc(r.so) + " · Gestor " + esc(r.pmo || "sin asignar") + '</span><span class="m">Ticket ' + (r.ticketCierre ? "en una etapa tratada como cierre" : "fuera de las etapas tratadas como cierre") + '</span><span class="m">Intervenciones de incidencia: ' + r.c.map(function (x) { return esc((EST[x.estado] || [x.estado])[0]) + " " + esc(corta(x.fin)); }).join(" · ") + "</span></button>";
    }) + "</section>";
    return h;
  }
  function pinta() {
    banda(); estado();
    $("fecha").textContent = larga(hoy());
    document.querySelectorAll("nav.tabs button").forEach(function (b) { if (b.dataset.tab === S.tab) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
    var m = $("main"), h = "";
    if (S.err) {
      h = '<div class="aviso"><p><strong>Sin datos.</strong> ' + esc(S.err.message) + "</p>" + (S.fuente && S.fuente.falta ? "<p>Falta:</p><ul>" + S.fuente.falta.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + '<p><a href="?fuente=demo">Abrir el modo de desarrollo con datos ficticios</a></p></div>';
    } else if (!S.ag || !S.al) h = '<div class="vacio">Leyendo…</div>';
    else h = S.tab === "agenda" ? vAgenda() : (S.tab === "alertas" ? vAlertas() : vDatos());
    m.innerHTML = h;
  }
  function carga() {
    if (S.cargando) return;
    S.cargando = true; S.err = null; S.ver = {}; pinta();
    var h0 = hoy();
    Promise.all([S.fuente.agenda({ desde: h0, hasta: suma(h0, 3) }), S.fuente.alertas()]).then(function (r) {
      r[0].filas.forEach(H.contrato.compruebaIntervencion);
      S.ag = r[0].filas; S.al = normalizaAlertas(r[1].filas); S.leido = Math.min(r[0].leidoEn, r[1].leidoEn);
    }).catch(function (e) { S.err = e; S.ag = S.al = null; }).then(function () { S.cargando = false; rellenaPmo(); pinta(); });
  }
  function abreFicha(so) {
    var hoja = $("hoja"), c = $("hoja-c");
    $("hoja-t").textContent = "Obra " + so; c.innerHTML = '<div class="vacio">Leyendo…</div>';
    hoja.classList.add("abierta"); hoja.setAttribute("aria-hidden", "false"); $("btn-cerrar").focus();
    S.fuente.ficha(so).then(function (r) {
      var f = r.ficha;
      if (!f) { c.innerHTML = '<div class="vacio">Sin ficha para esta SO en la fuente actual.</div>'; return; }
      c.innerHTML = '<div class="card"><span class="t">' + esc(f.cliente || "") + '</span><span class="m">' + esc(f.ciudad || "") + " · " + esc(f.tipoObra || "") + '</span><span class="m">Obra ' + esc(EST_SO[f.estadoSo] || f.estadoSo) + " · Gestor " + esc(f.pmo || "sin asignar") + (f.incidencia ? " · marca de incidencia" : "") + "</span></div>" +
        '<div class="card"><span class="t">Intervenciones · ' + f.intervenciones.length + "</span>" + (f.intervenciones.length ? f.intervenciones.map(function (x) { return '<span class="m">' + esc(x.tipo) + " " + pill(x.estado) + " · " + esc(corta(x.desde)) + "</span>"; }).join("") : '<span class="m">Sin intervenciones en esta fuente.</span>') + "</div>" +
        '<p class="exp">' + (S.fuente.enVivo ? "Leída a las " : "Ficha ficticia generada a las ") + esc(hora(r.leidoEn)) + ". Teléfono, dirección e importe no se muestran hasta decidir quién puede verlos.</p>";
    }).catch(function (e) { c.innerHTML = '<div class="aviso"><p>' + esc(e.message) + "</p></div>"; });
  }
  function cierraFicha() { var hoja = $("hoja"); hoja.classList.remove("abierta"); hoja.setAttribute("aria-hidden", "true"); $("main").focus(); }

  document.addEventListener("click", function (ev) {
    var t = ev.target.closest("[data-so],[data-mas],[data-tab]");
    if (!t) return;
    if (t.dataset.tab) { S.tab = t.dataset.tab; pinta(); $("main").scrollTop = 0; return; }
    if (t.dataset.mas) { S.ver[t.dataset.mas] = (S.ver[t.dataset.mas] || 12) + 12; pinta(); return; }
    if (t.dataset.so) abreFicha(t.dataset.so);
  });
  $("btn-leer").addEventListener("click", carga);
  $("btn-cerrar").addEventListener("click", cierraFicha);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cierraFicha(); });
  $("sel-gestor").addEventListener("change", function (e) { S.pmo = e.target.value; S.ver = {}; pinta(); });

  var pedida = (new URLSearchParams(location.search).get("fuente") || "demo");
  S.fuente = H.contrato.compruebaFuente(pedida === "servidor" ? H.fuenteServidor : H.fuenteDemo);
  pinta(); carga();

  // Instalación: solo se registra el service worker en HTTPS o localhost.
  if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* sin instalación: la app funciona igual */ });
  }
  g.HoyObras.version = VERSION;
})(window);
