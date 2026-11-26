/* Guía local de ejercicios: zonas musculares esquemáticas e instrucciones breves. */
'use strict';

(() => {
  const guides = [
    [/press banca|press de banca|banca|flexion|apertura|cruce|pec deck/, 'Pecho', 'Tumbado o con el torso estable, baja el peso con control hacia el pecho. Empuja sin rebotar y mantén las muñecas alineadas.'],
    [/remo|jalon|pulldown|dominada|face pull/, 'Espalda', 'Inicia el tirón llevando los codos hacia atrás o abajo. Mantén el tronco firme y evita balancearte para mover el peso.'],
    [/sentadilla|prensa|zancada|extension de cuadriceps|curl femoral/, 'Piernas', 'Apoya todo el pie y acompaña el movimiento con las rodillas en la dirección de los pies. Usa un recorrido cómodo y controlado.'],
    [/peso muerto|rumano|buenos dias/, 'Espalda', 'Lleva la cadera atrás con la espalda neutra y el peso cerca del cuerpo. Termina erguido sin hiperextender la zona lumbar.'],
    [/hip thrust|puente de gluteo|patada de gluteo/, 'Glúteos', 'Empuja desde los talones y extiende la cadera. Mantén las costillas recogidas y no arquees la espalda al final.'],
    [/press militar|press hombro|arnold/, 'Hombros', 'Empuja sobre la cabeza con abdomen firme. Baja hasta un rango cómodo sin encoger los hombros.'],
    [/elevacion lateral|elevacion frontal|pajaro|deltoide posterior/, 'Hombros', 'Eleva los brazos con ligera flexión de codos y sin impulso. Detén el recorrido antes de que los hombros se encojan.'],
    [/curl|biceps/, 'Bíceps', 'Mantén los codos cerca del cuerpo. Flexiona y baja el brazo despacio, sin balancear el tronco.'],
    [/triceps|extension de codo|fondos/, 'Tríceps', 'Fija los hombros y mueve el antebrazo. Extiende el codo con control, sin bloquearlo con fuerza.'],
    [/plancha|crunch|abdominal|rueda/, 'Core', 'Mantén el tronco estable y respira. Evita que la zona lumbar se hunda o que el cuello cargue el esfuerzo.'],
    [/correr|cinta|bici|eliptica/, 'Cardio', 'Empieza a un ritmo que puedas sostener y aumenta la intensidad de forma gradual. Ajusta la máquina antes de empezar.'],
  ];
  const targets = { Pecho: 'chest', Espalda: 'back', Hombros: 'shoulders', Bíceps: 'biceps', Tríceps: 'triceps', Piernas: 'legs', Glúteos: 'glutes', Core: 'core', Cardio: 'legs', Otro: 'core' };
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
  const body = muscle => {
    const target = targetOf(muscle), view = BACK.has(target) ? 'back' : 'front';
    const shapes = SHAPES[view].replace(new RegExp(`class="muscle ${target}"`, 'g'), `class="muscle active ${target}"`);
    return `<svg class="muscle-map" viewBox="0 0 160 180" role="img" aria-label="Esquema del grupo muscular: ${escape(muscle)}${view === 'back' ? ', vista de espaldas' : ''}">
    <circle cx="80" cy="20" r="12"/><path class="silhouette" d="M68 35 Q80 30 92 35 L100 73 95 107 98 166 83 166 80 118 77 166 62 166 65 107 60 73Z"/>
    <path class="silhouette" d="M62 42 47 48 35 85 42 89 58 61M98 42 113 48 125 85 118 89 102 61"/>
    ${shapes}</svg>${view === 'back' ? '<small class="view-note">Vista de espaldas</small>' : ''}`;
  };
  function guideHTML(ex) {
    const name = String(ex.name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const guide = guides.find(([pattern]) => pattern.test(name));
    const muscle = guide ? guide[1] : (ex.muscle || 'Otro');
    const instruction = guide ? guide[2] : 'Consulta el nombre y el grupo muscular como referencia. Empieza con poco peso, controla el recorrido y detente si aparece dolor.';
    return `<section class="card exercise-guide"><div>${body(muscle)}</div><div><div class="label">${escape(muscle)}</div><h3>Cómo hacerlo</h3><p>${instruction}</p><small>Ilustración esquemática del grupo principal; otros músculos también pueden participar.</small></div></section>`;
  }
  window.exerciseGuideHTML = guideHTML;
})();
