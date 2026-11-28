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
    [/press de pecho en maquina|press convergente/, 'Pecho', 'Ajusta el asiento para que las empuñaduras queden a la altura del centro del pecho.', 'Empuja hacia delante sin despegar la espalda y regresa hasta un estiramiento cómodo.', 'No bloquees los codos ni adelantes los hombros al final.', ['Tríceps', 'Hombros']],
    [/press en el suelo con mancuernas/, 'Pecho', 'Túmbate con las rodillas flexionadas y las mancuernas sobre el pecho.', 'Baja hasta que los brazos toquen suavemente el suelo y vuelve a empujar.', 'No rebotes los codos ni arquees la zona lumbar.', ['Tríceps']],
    [/fondos inclinados para pecho/, 'Pecho', 'Sujeta las barras y lleva el torso ligeramente hacia delante.', 'Flexiona los codos hasta un rango cómodo y empuja para subir.', 'No bajes con dolor ni dejes que los hombros se vayan hacia las orejas.', ['Tríceps', 'Hombros']],
    [/remo con pecho apoyado/, 'Espalda', 'Apoya el pecho en el banco o máquina y deja los brazos extendidos.', 'Lleva los codos atrás y junta los omóplatos; baja con control.', 'No levantes el pecho del apoyo ni encogas los hombros.', ['Bíceps']],
    [/remo landmine|meadows row|t-bar row/, 'Espalda', 'Colócate estable frente a la barra anclada e inclina la cadera con la espalda neutra.', 'Lleva el codo hacia la cadera y devuelve la barra sin girar el tronco.', 'No tires con impulso ni redondees la espalda.', ['Bíceps', 'Core']],
    [/pullover en polea|straight arm pulldown/, 'Espalda', 'Colócate frente a la polea alta y mantén una ligera flexión de codos.', 'Lleva la barra hacia los muslos sin mover el tronco y vuelve despacio.', 'No conviertas el gesto en un press ni arquees la espalda.', ['Core']],
    [/extensiones lumbares|back extension|hyperextension/, 'Espalda', 'Ajusta el apoyo bajo la cadera y mantén el cuello alineado con el tronco.', 'Inclina el torso y vuelve hasta quedar recto, contrayendo glúteos.', 'No hiperextiendas la espalda ni busques más recorrido con dolor.', ['Glúteos', 'Piernas']],
    [/encogimientos con mancuernas|dumbbell shrug/, 'Espalda', 'Sujeta las mancuernas a los lados y deja los brazos relajados.', 'Eleva los hombros en vertical, pausa y baja lentamente.', 'No hagas círculos con los hombros ni balancees el cuerpo.', ['Antebrazos']],
    [/remo al menton|upright row/, 'Hombros', 'Sujeta la barra delante del cuerpo con un agarre cómodo y muñecas neutras.', 'Guía la barra cerca del torso hasta una altura que no moleste al hombro.', 'No fuerces una subida alta ni cierres en exceso el agarre.', ['Bíceps']],
    [/curl alterno con mancuernas/, 'Bíceps', 'Sujeta una mancuerna en cada mano y fija los codos junto al torso.', 'Flexiona un brazo cada vez y gira la palma hacia arriba al subir.', 'No balancees el cuerpo ni adelantes el codo.', ['Antebrazos']],
    [/curl inclinado con mancuernas/, 'Bíceps', 'Apoya la espalda en un banco inclinado y deja los brazos colgar sin dolor.', 'Flexiona los codos manteniendo quieta la parte alta del brazo.', 'No estires el hombro más allá de una posición cómoda.', ['Antebrazos']],
    [/curl concentrado/, 'Bíceps', 'Siéntate e inmoviliza el brazo apoyando el codo contra la cara interna del muslo.', 'Flexiona el codo y baja la mancuerna lentamente.', 'No gires el tronco ni despegues el codo del apoyo.', []],
    [/extension de triceps con cuerda/, 'Tríceps', 'Coloca la polea alta y fija los codos junto al cuerpo.', 'Extiende los brazos y separa suavemente los extremos de la cuerda al final.', 'No balancees el torso ni muevas los codos hacia delante.', []],
    [/extension de triceps con mancuerna/, 'Tríceps', 'Sujeta la mancuerna sobre la cabeza con los brazos estables.', 'Flexiona los codos para bajar detrás de la cabeza y extiéndelos con control.', 'No arquees la zona lumbar ni abras los codos en exceso.', ['Hombros']],
    [/press frances con barra z|skull crusher|rompecraneos/, 'Tríceps', 'Túmbate y sostén la barra Z sobre los hombros con los brazos verticales.', 'Flexiona los codos para acercar la barra a la frente y vuelve a extenderlos.', 'No muevas los brazos desde el hombro ni bloquees con brusquedad.', ['Hombros']],
    [/fondos para triceps|triceps dips/, 'Tríceps', 'Apoya las manos en barras o banco y mantén el pecho cerca del apoyo.', 'Flexiona y extiende los codos dentro de un rango cómodo.', 'No desciendas si molesta el hombro ni rebotes al subir.', ['Pecho', 'Hombros']],
    [/patada de triceps con mancuerna|triceps kickback/, 'Tríceps', 'Inclina el torso con la espalda neutra y mantén el codo pegado al costado.', 'Extiende el antebrazo hacia atrás y vuelve sin mover el brazo.', 'No uses impulso ni gires la muñeca para levantar más.', []],
    [/subida al cajon|step up/, 'Piernas', 'Coloca un pie completo sobre un cajón estable y mira al frente.', 'Empuja con la pierna elevada para subir y baja despacio.', 'No rebotes con el pie del suelo ni dejes que la rodilla se hunda hacia dentro.', ['Glúteos', 'Core']],
    [/elevacion de piernas|leg raise/, 'Core', 'Túmbate y sujeta un apoyo estable; pega suavemente la zona lumbar al suelo.', 'Eleva las piernas controlando la pelvis y bájalas solo hasta donde mantengas la espalda estable.', 'No arquees la zona lumbar ni uses balanceo.', ['Hombros']],
    [/press pallof|pallof press/, 'Core', 'Colócate de lado a una polea o banda y sujeta el agarre frente al pecho.', 'Extiende los brazos y resiste que el tronco gire; vuelve despacio.', 'No gires la cadera ni contengas la respiración.', ['Hombros']],
    [/saltar a la comba|jump rope|skipping rope/, 'Cardio', 'Ajusta la cuerda para que las empuñaduras lleguen aproximadamente a las axilas.', 'Gírala desde las muñecas y salta bajo, aterrizando con suavidad.', 'No saltes demasiado alto ni continúes si aparece dolor.', ['Piernas']],
    [/correr|cinta|running|treadmill/, 'Cardio', 'Ajusta velocidad e inclinación antes de subir y empieza suave.', 'Mantén un ritmo que puedas sostener y aumenta gradualmente.', 'No saltes de la cinta en movimiento; reduce la velocidad primero.', ['Piernas']],
    [/bicicleta|bici|cycling|spinning/, 'Cardio', 'Ajusta altura del sillín para que la rodilla quede ligeramente flexionada abajo.', 'Pedalea fluido y regula la resistencia de forma gradual.', 'No pedalees con el sillín demasiado bajo ni fuerces una cadencia dolorosa.', ['Piernas']],
    [/eliptica|elíptica|elliptical|remo indoor|ergometro/, 'Cardio', 'Coloca los pies en los apoyos y agarra las empuñaduras con una postura alta.', 'Mantén un ritmo continuo y acompaña el movimiento con brazos y piernas.', 'No te encorves ni aumentes la resistencia de golpe.', ['Piernas', 'Espalda']],
  ];
  const targets = { Pecho: 'chest', Espalda: 'back', Hombros: 'shoulders', Bíceps: 'biceps', Antebrazos: 'forearms', Tríceps: 'triceps', Piernas: 'legs', Glúteos: 'glutes', Core: 'core', Cardio: 'legs', Otro: 'core' };
  const targetOf = muscle => (Object.prototype.hasOwnProperty.call(targets, muscle) ? targets[muscle] : 'core');
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Mapa vectorial propio y esquemático: divide zonas para orientar, sin reutilizar láminas de terceros.
  const SHAPES = {
    front: `<path class="muscle chest" d="M79 49 Q69 43 61 50 L65 62 Q72 67 79 61ZM81 49 Q91 43 99 50 L95 62 Q88 67 81 61Z"/>
    <path class="muscle shoulders" d="M62 40 Q53 40 52 50 L60 57 68 48ZM98 40 Q107 40 108 50 L100 57 92 48Z"/>
    <path class="muscle biceps" d="M53 53 Q48 55 45 68 L50 74 58 59ZM107 53 Q112 55 115 68 L110 74 102 59Z"/>
    <path class="muscle forearms" d="M45 73 40 85 44 91 52 76ZM115 73 120 85 116 91 108 76Z"/>
    <path class="muscle core" d="M76 64 84 64 87 76 81 76ZM73 78 79 78 79 88 72 88ZM81 78 88 78 88 88 81 88ZM72 90 79 90 79 100 72 100ZM81 90 88 90 88 100 81 100Z"/>
    <path class="muscle legs" d="M65 105 Q72 103 78 106 L76 131 72 147 63 147 64 128ZM95 105 Q88 103 82 106 L84 131 88 147 97 147 96 128Z"/>
    <path class="muscle calves" d="M64 149 73 149 72 166 65 168ZM87 149 96 149 95 168 88 166Z"/>`,
    back: `<path class="muscle shoulders" d="M62 40 Q53 40 52 50 L60 57 68 48ZM98 40 Q107 40 108 50 L100 57 92 48Z"/>
    <path class="muscle back" d="M68 43 Q80 39 92 43 L96 61 90 72 87 91 80 96 73 91 70 72 64 61Z"/>
    <path class="muscle triceps" d="M53 53 Q48 55 45 68 L50 74 58 59ZM107 53 Q112 55 115 68 L110 74 102 59Z"/>
    <path class="muscle forearms" d="M45 73 40 85 44 91 52 76ZM115 73 120 85 116 91 108 76Z"/>
    <path class="muscle glutes" d="M65 97 Q72 91 79 98 L78 111 66 113ZM95 97 Q88 91 81 98 L82 111 94 113Z"/>
    <path class="muscle legs" d="M65 114 77 113 76 132 72 147 63 147ZM95 114 83 113 84 132 88 147 97 147Z"/>
    <path class="muscle calves" d="M64 149 73 149 72 166 65 168ZM87 149 96 149 95 168 88 166Z"/>`,
  };
  const ANATOMY_LINES = {
    front: `<path class="anatomy-lines" d="M60 43 Q72 43 80 50 Q88 43 100 43 M80 50 V63 M66 64 Q73 68 80 66 Q87 68 94 64 M67 75 Q74 72 80 75 Q86 72 93 75 M68 88 Q74 85 80 88 Q86 85 92 88 M69 100 Q74 97 80 100 Q86 97 91 100 M62 86 Q67 90 69 98 M98 86 Q93 90 91 98 M40 88 Q43 91 47 91 M120 88 Q117 91 113 91 M64 128 Q69 132 75 130 M96 128 Q91 132 85 130 M64 148 Q69 151 73 149 M96 148 Q91 151 87 149"/>`,
    back: `<path class="anatomy-lines" d="M59 44 Q67 43 73 47 L80 55 87 47 Q93 43 101 44 M80 48 V96 M67 55 Q72 53 78 60 L75 72 Q69 71 64 63 M93 55 Q88 53 82 60 L85 72 Q91 71 96 63 M69 72 Q73 78 76 89 M91 72 Q87 78 84 89 M65 96 Q72 93 79 99 M95 96 Q88 93 81 99 M66 112 Q72 115 78 112 M94 112 Q88 115 82 112 M64 131 Q70 135 76 132 M96 131 Q90 135 84 132 M64 147 Q68 150 73 149 M96 147 Q92 150 87 149 M40 88 Q43 91 47 91 M120 88 Q117 91 113 91"/>`,
  };
  function mapView(view, muscle, secondary) {
    const primary = targetOf(muscle);
    const other = new Set(secondary.map(targetOf).filter(target => target !== primary));
    const shapes = SHAPES[view].replace(/class="muscle ([a-z]+)"/g, (match, part) =>
      part === primary ? `class="muscle active ${part}"` : other.has(part) ? `class="muscle active-secondary ${part}"` : match);
    const side = view === 'back' ? 'espaldas' : 'frontal';
    return `<svg class="muscle-map" viewBox="0 0 160 180" role="img" aria-label="Mapa muscular ${side}: ${escape(muscle)}${secondary.length ? `; también ${secondary.map(escape).join(', ')}` : ''}">
      <circle class="silhouette" cx="80" cy="19" r="11"/>
      <path class="silhouette" d="M69 34 Q80 29 91 34 L101 43 98 71 94 99 98 145 96 169 85 169 80 121 75 169 64 169 62 145 66 99 62 71 59 43Z"/>
      <path class="silhouette" d="M61 42 49 47 35 81 Q33 88 40 91 L45 88 56 63 66 57ZM99 42 111 47 125 81 Q127 88 120 91 L115 88 104 63 94 57Z"/>${shapes}${ANATOMY_LINES[view]}</svg>
      <small class="view-note">${view === 'back' ? 'vista de espaldas' : 'vista frontal'}</small>`;
  }
  const body = (muscle, secondary = []) => {
    const views = ['front', 'back'];
    const maps = views.map(view => mapView(view, muscle, secondary)).join('');
    return `<div class="muscle-views multi">${maps}</div><small class="map-legend"><i class="map-key primary-key"></i> Principal <i class="map-key secondary-key"></i> Secundario</small>`;
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
