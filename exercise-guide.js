/* Catálogo sin red, inspirado en la claridad didáctica de MuscleWiki; dibujos propios, no imágenes copiadas. */
'use strict';

(() => {
  const guides = [
    [/press banca|press de banca|bench press/, 'Pecho', 'Apoya pies, espalda y glúteos; coloca las manos algo más abiertas que los hombros.', 'Baja la barra hacia el pecho con control y empuja sin rebotar ni bloquear los brazos.', 'No separes los glúteos del banco ni pierdas la alineación de las muñecas.', ['Tríceps', 'Hombros']],
    [/press inclinado|banca inclinada/, 'Pecho', 'Ajusta el banco a una inclinación moderada y apoya los pies en el suelo.', 'Baja las mancuernas o la barra a la parte alta del pecho y vuelve a empujar.', 'No arquees la espalda ni choques las pesas arriba.', ['Tríceps', 'Hombros']],
    [/press declinado/, 'Pecho', 'Asegura los pies y mantén la cabeza apoyada en el banco.', 'Baja el peso hacia la zona baja del pecho y empuja en la misma trayectoria.', 'No fuerces el cuello ni rebotes abajo.', ['Tríceps', 'Hombros']],
    [/apertura|cruce de polea|crossover|pec deck|contractora/, 'Pecho', 'Mantén una ligera flexión de codos y coloca los hombros bajos.', 'Junta los brazos delante del pecho y vuelve despacio hasta un estiramiento cómodo.', 'No conviertas la apertura en un press doblando más los codos.', ['Hombros']],
    [/flexion|push ?up|fondos en paralelas/, 'Pecho', 'Forma una línea estable de cabeza a talones y coloca las manos bajo los hombros.', 'Baja el pecho entre las manos y empuja el suelo para volver.', 'No dejes caer la cadera ni adelantes la cabeza.', ['Tríceps', 'Core']],
    [/remo sentado|remo en polea|remo con cable|seated cable row|seated row|cable row/, 'Espalda', 'Siéntate estable, sujeta el agarre y alarga los brazos sin redondear la espalda.', 'Lleva los codos atrás y acerca el agarre al torso; vuelve lentamente.', 'No te balancees ni eleves los hombros.', ['Bíceps', 'Hombros']],
    [/remo con barra|remo inclinado/, 'Espalda', 'Inclina la cadera con la espalda neutra y las rodillas ligeramente flexionadas.', 'Lleva la barra hacia el abdomen y baja con control.', 'No redondees la zona lumbar ni uses impulso.', ['Bíceps', 'Core']],
    [/remo con mancuerna|remo unilateral/, 'Espalda', 'Apoya una mano y mantén el torso firme y paralelo al suelo.', 'Lleva el codo hacia la cadera y baja la mancuerna sin girar el cuerpo.', 'No tires del hombro hacia la oreja.', ['Bíceps', 'Hombros']],
    [/jalon|jalón|pulldown/, 'Espalda', 'Sujeta la barra algo más abierta que los hombros y fija los muslos bajo el apoyo.', 'Lleva la barra hacia la parte alta del pecho y controla la subida.', 'No tires tras la nuca ni te balancees hacia atrás.', ['Bíceps', 'Hombros']],
    [/dominada|pull ?up/, 'Espalda', 'Cuelga con un agarre firme y activa los hombros antes de iniciar.', 'Sube llevando los codos hacia abajo y desciende de forma controlada.', 'Evita impulsarte con las piernas o encoger el cuello.', ['Bíceps', 'Core']],
    [/face ?pull|tiron a la cara/, 'Hombros', 'Coloca la polea a la altura de la cara y sujeta la cuerda con pulgares hacia atrás.', 'Separa las manos hacia las sienes y junta suavemente los omóplatos.', 'No arquees la espalda ni eleves los hombros.', ['Espalda']],
    [/peso muerto rumano|peso muerto con piernas rigidas|buenos dias/, 'Piernas', 'Sujeta el peso cerca del cuerpo y desbloquea ligeramente las rodillas.', 'Lleva la cadera atrás hasta notar tensión en la parte posterior de las piernas; vuelve apretando glúteos.', 'No redondees la espalda ni bajes más allá de tu movilidad.', ['Glúteos', 'Espalda']],
    [/peso muerto|deadlift/, 'Piernas', 'Coloca los pies bajo la barra y acerca las espinillas; prepara el abdomen y la espalda neutra.', 'Empuja el suelo y extiende cadera y rodillas a la vez; baja siguiendo el mismo recorrido.', 'No tires de la barra con la espalda redondeada ni hiperextiendas arriba.', ['Glúteos', 'Espalda']],
    [/sentadilla|squat/, 'Piernas', 'Apoya todo el pie y coloca las rodillas en la dirección de los dedos.', 'Flexiona cadera y rodillas hasta un rango cómodo y empuja el suelo para subir.', 'No levantes los talones ni dejes colapsar las rodillas hacia dentro.', ['Glúteos', 'Core']],
    [/prensa de piernas|leg press|prensa/, 'Piernas', 'Apoya espalda y cadera en el respaldo y coloca los pies a una anchura cómoda.', 'Desbloquea el seguro, baja controladamente y empuja sin bloquear las rodillas.', 'No despegues la cadera del respaldo ni bajes con dolor.', ['Glúteos']],
    [/extension de cuadriceps|extension de pierna|leg extension/, 'Piernas', 'Ajusta el eje de la máquina a la rodilla y coloca el rodillo sobre los tobillos.', 'Extiende las rodillas y baja el peso lentamente.', 'No des golpes al final del recorrido.', []],
    [/curl femoral|leg curl/, 'Piernas', 'Alinea la rodilla con el eje y apoya el rodillo sobre la parte baja de la pierna.', 'Flexiona la rodilla acercando el rodillo y regresa despacio.', 'No levantes la cadera ni rebotes el peso.', ['Glúteos']],
    [/aduccion de cadera|aductor|hip adduction/, 'Piernas', 'Siéntate con la espalda apoyada y ajusta los soportes al interior de las rodillas.', 'Junta las piernas de forma controlada y vuelve sin dejar que el peso golpee.', 'No uses impulso ni fuerces una apertura dolorosa.', []],
    [/abduccion de cadera|abductor|hip abduction/, 'Glúteos', 'Siéntate estable con las rodillas apoyadas en los soportes exteriores.', 'Abre las piernas contra la resistencia y regresa lentamente.', 'No arquees la espalda ni rebotes al cerrar.', ['Piernas']],
    [/zancada|lunge|bulgara|búlgara/, 'Piernas', 'Coloca los pies en dos carriles y mantén el torso erguido.', 'Baja la rodilla de atrás hacia el suelo y empuja con el pie delantero para subir.', 'No juntes los pies en una sola línea ni dejes caer la rodilla hacia dentro.', ['Glúteos', 'Core']],
    [/hip thrust|puente de gluteo|glute bridge/, 'Glúteos', 'Apoya la parte alta de la espalda y coloca los pies bajo las rodillas.', 'Extiende la cadera hasta alinear torso y muslos, y baja sin perder el control.', 'No arquees la zona lumbar para ganar recorrido.', ['Piernas', 'Core']],
    [/patada de gluteo|kickback/, 'Glúteos', 'Sujétate a la máquina o polea y mantén el abdomen firme.', 'Lleva la pierna atrás sin girar la pelvis y vuelve despacio.', 'No balancees el tronco ni arquees la espalda.', ['Piernas']],
    [/gemelo|elevacion de talones|calf raise/, 'Piernas', 'Apoya la parte delantera del pie y mantén las rodillas relajadas.', 'Eleva los talones, pausa arriba y baja hasta un estiramiento cómodo.', 'No rebotes ni acortes el recorrido.', []],
    [/press militar|press de hombro|press hombro|shoulder press|overhead press|arnold/, 'Hombros', 'Coloca las pesas a la altura de los hombros y aprieta abdomen y glúteos.', 'Empuja sobre la cabeza y baja hasta una posición cómoda.', 'No arquees la zona lumbar ni encojas los hombros.', ['Tríceps']],
    [/elevacion(?:es)? lateral(?:es)?|lateral raise/, 'Hombros', 'Sujeta las mancuernas a los lados con los codos ligeramente flexionados.', 'Eleva los brazos hasta la altura de los hombros y baja despacio.', 'No cojas impulso ni eleves los hombros hacia las orejas.', []],
    [/elevacion frontal|elevación frontal/, 'Hombros', 'Mantén el tronco firme y las muñecas neutras.', 'Eleva las manos delante hasta la altura de los hombros y desciende con control.', 'No balancees el cuerpo para subir más peso.', ['Pecho']],
    [/pajaro|deltoide posterior|reverse fly|aperturas inversas/, 'Hombros', 'Inclina el torso o apoya el pecho y deja una flexión suave en los codos.', 'Abre los brazos hacia los lados y vuelve lentamente.', 'No encorves el cuello ni conviertas el gesto en un remo.', ['Espalda']],
    [/curl predicador|curl scott|preacher curl/, 'Bíceps', 'Apoya los brazos en el banco y mantén los hombros relajados.', 'Flexiona los codos y baja hasta casi extenderlos, sin perder tensión.', 'No despegues los brazos del apoyo ni rebotes abajo.', ['Antebrazos']],
    [/curl martillo|hammer curl/, 'Bíceps', 'Sujeta las mancuernas con las palmas enfrentadas y los codos junto al torso.', 'Flexiona un brazo cada vez y baja despacio.', 'No balancees el tronco ni adelantes los codos.', ['Antebrazos']],
    [/curl barra|curl con barra|curl mancuerna|curl de biceps|bicep curl|biceps/, 'Bíceps', 'Mantén los codos cerca del cuerpo y las muñecas rectas.', 'Flexiona el codo y baja el peso lentamente.', 'No balancees el torso para completar la repetición.', ['Antebrazos']],
    [/triceps en polea|tríceps en polea|pushdown|jalon de triceps/, 'Tríceps', 'Fija los codos junto al cuerpo y sujeta la cuerda o barra.', 'Extiende los codos y regresa hasta una flexión cómoda.', 'No muevas los hombros ni uses el peso del cuerpo.', []],
    [/extension de triceps sobre la cabeza|overhead tricep extension|lying tricep extension|extension francesa|skull crusher|rompecraneos/, 'Tríceps', 'Mantén los brazos estables y los codos apuntando al frente.', 'Flexiona los codos para bajar el peso y extiéndelos sin mover el hombro.', 'No abras los codos ni dejes caer la carga rápidamente.', ['Hombros']],
    [/plancha|plank/, 'Core', 'Apoya antebrazos y pies, con cabeza, cadera y talones alineados.', 'Mantén la postura respirando con normalidad y aprieta el abdomen.', 'No dejes caer la cadera ni contengas la respiración.', ['Hombros']],
    [/crunch|abdominal|sit ?up/, 'Core', 'Túmbate con las rodillas flexionadas y relaja el cuello.', 'Acerca las costillas a la pelvis y baja lentamente.', 'No tires de la cabeza ni uses impulso.', []],
    [/rueda abdominal|ab wheel|rollout/, 'Core', 'Arrodíllate, sujeta la rueda y aprieta glúteos y abdomen.', 'Avanza solo hasta donde puedas mantener el tronco estable y vuelve.', 'No dejes que la zona lumbar se hunda.', ['Hombros']],
    [/correr|cinta|running|treadmill/, 'Cardio', 'Ajusta velocidad e inclinación antes de subir y empieza suave.', 'Mantén un ritmo que puedas sostener y aumenta gradualmente.', 'No saltes de la cinta en movimiento; reduce la velocidad primero.', ['Piernas']],
    [/bicicleta|bici|cycling|spinning/, 'Cardio', 'Ajusta altura del sillín para que la rodilla quede ligeramente flexionada abajo.', 'Pedalea fluido y regula la resistencia de forma gradual.', 'No pedalees con el sillín demasiado bajo ni fuerces una cadencia dolorosa.', ['Piernas']],
    [/eliptica|elíptica|elliptical|remo indoor|ergometro/, 'Cardio', 'Coloca los pies en los apoyos y agarra las empuñaduras con una postura alta.', 'Mantén un ritmo continuo y acompaña el movimiento con brazos y piernas.', 'No te encorves ni aumentes la resistencia de golpe.', ['Piernas', 'Espalda']],
  ];
  const targets = { Pecho: 'chest', Espalda: 'back', Hombros: 'shoulders', Bíceps: 'biceps', Antebrazos: 'biceps', Tríceps: 'triceps', Piernas: 'legs', Glúteos: 'glutes', Core: 'core', Cardio: 'legs', Otro: 'core' };
  const BACK = new Set(['back', 'triceps', 'glutes']);      // se ven mejor por detrás
  const targetOf = muscle => (Object.prototype.hasOwnProperty.call(targets, muscle) ? targets[muscle] : 'core');
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Silueta de frente (pecho, hombros, bíceps, abdomen, piernas) o de espaldas (espalda, tríceps, glúteos).
  const SHAPES = {
    front: `<ellipse class="muscle chest" cx="80" cy="58" rx="19" ry="11"/>
    <circle class="muscle shoulders" cx="62" cy="43" r="8"/><circle class="muscle shoulders" cx="98" cy="43" r="8"/>
    <path class="muscle biceps" d="M50 51 43 72 49 74 57 55M110 51 117 72 111 74 103 55"/>
    <ellipse class="muscle core" cx="80" cy="83" rx="13" ry="20"/>
    <path class="muscle legs" d="M65 110 77 112 75 158 63 158ZM83 112 95 110 97 158 85 158Z"/>`,
    back: `<path class="muscle back" d="M64 44 Q80 40 96 44 L94 70 Q88 92 80 96 Q72 92 66 70Z"/>
    <circle class="muscle shoulders" cx="62" cy="43" r="8"/><circle class="muscle shoulders" cx="98" cy="43" r="8"/>
    <path class="muscle triceps" d="M50 51 43 72 49 74 57 55M110 51 117 72 111 74 103 55"/>
    <path class="muscle glutes" d="M65 99 Q80 91 95 99 L93 112 67 112Z"/>
    <path class="muscle legs" d="M65 113 77 114 75 158 63 158ZM83 114 95 113 97 158 85 158Z"/>`,
  };
  function mapView(view, muscle, secondary) {
    const primary = targetOf(muscle);
    const other = new Set(secondary.map(targetOf).filter(target => target !== primary));
    const shapes = SHAPES[view].replace(/class="muscle ([a-z]+)"/g, (match, part) =>
      part === primary ? `class="muscle active ${part}"` : other.has(part) ? `class="muscle active-secondary ${part}"` : match);
    const side = view === 'back' ? 'espaldas' : 'frontal';
    return `<svg class="muscle-map" viewBox="0 0 160 180" role="img" aria-label="Mapa muscular ${side}: ${escape(muscle)}${secondary.length ? `; también ${secondary.map(escape).join(', ')}` : ''}">
      <circle cx="80" cy="20" r="12"/><path class="silhouette" d="M68 35 Q80 30 92 35 L100 73 95 107 98 166 83 166 80 118 77 166 62 166 65 107 60 73Z"/>
      <path class="silhouette" d="M62 42 47 48 35 85 42 89 58 61M98 42 113 48 125 85 118 89 102 61"/>${shapes}</svg>
      <small class="view-note">${view === 'back' ? 'vista de espaldas' : 'vista frontal'}</small>`;
  }
  const body = (muscle, secondary = []) => {
    const views = new Set([targetOf(muscle), ...secondary.map(targetOf)].map(target => BACK.has(target) ? 'back' : 'front'));
    const maps = [...views].map(view => mapView(view, muscle, secondary)).join('');
    return `<div class="muscle-views${views.size > 1 ? ' multi' : ''}">${maps}</div><small class="map-legend"><i class="map-key primary-key"></i> Principal <i class="map-key secondary-key"></i> Secundario</small>`;
  };
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const findGuide = name => guides.find(([pattern]) => pattern.test(normalize(name))) || null;
  function guideHTML(ex) {
    const guide = findGuide(ex.name);
    const custom = ex.guide || {};
    const muscle = custom.primary ? (ex.muscle || guide?.[1] || 'Otro') : (guide ? guide[1] : (ex.muscle || 'Otro'));
    const instruction = guide ? [['Colocación', guide[2]], ['Movimiento', guide[3]], ['Error típico', guide[4]]]
      .map(([label, value]) => `<p><b>${label}:</b> ${escape(value)}</p>`).join('')
      : '<p>Empieza con poco peso, controla el recorrido y detente si aparece dolor. Si no conoces la técnica, pide orientación antes de aumentar la carga.</p>';
    const customSteps = [['Colocación', custom.setup], ['Movimiento', custom.move], ['Evita', custom.error]]
      .filter(([, value]) => value).map(([label, value]) => `<p><b>${label}:</b> ${escape(value)}</p>`).join('');
    const secondary = (Array.isArray(custom.secondaryMuscles) ? custom.secondaryMuscles : (guide ? guide[5] : []))
      .filter((x, i, values) => x && x !== muscle && values.indexOf(x) === i);
    const extraMuscles = secondary.length ? `<p class="sub">También trabaja: ${secondary.map(escape).join(', ')}</p>` : '';
    const ownNotes = custom.notes ? `<p class="fine">${escape(custom.notes)}</p>` : '';
    const actions = ex.id ? `<div class="exercise-guide-actions"><button class="btn btn-ghost btn-small" data-guide-edit data-guide-id="${escape(ex.id)}">Editar mi guía</button><button class="btn btn-ghost btn-small${ex.favorite ? ' on' : ''}" data-ex-favorite data-guide-id="${escape(ex.id)}">${ex.favorite ? '★ Favorito' : '☆ Favorito'}</button></div>` : '';
    return `<section class="card exercise-guide" data-guide-card="${escape(ex.id || '')}"><div>${body(muscle, secondary)}</div><div><div class="label">${escape(muscle)}</div><h3>Cómo hacerlo</h3>${customSteps || instruction}${extraMuscles}${ownNotes}<small>Mapa esquemático orientativo, no una ilustración anatómica clínica.</small>${actions}</div></section>`;
  }
  window.exerciseGuideHTML = guideHTML;
  window.GymExerciseGuide = Object.freeze({ find: name => { const row = findGuide(name); return row && { muscle: row[1], setup: row[2], move: row[3], error: row[4], secondary: row[5] }; }, count: guides.length });
})();
