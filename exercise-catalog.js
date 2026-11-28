/* Catálogo local curado para seleccionar ejercicios sin conexión ni servicios externos. */
'use strict';

(function exposeExerciseCatalog(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ExerciseCatalog = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function buildExerciseCatalog() {
  const rows = [
    ['press-banca-barra', 'Press banca con barra', 'Pecho', 'Barra', ['press de banca', 'bench press'], ['Tríceps', 'Hombros']],
    ['press-banca-mancuernas', 'Press banca con mancuernas', 'Pecho', 'Mancuernas', ['press plano con mancuernas', 'dumbbell bench press'], ['Tríceps', 'Hombros']],
    ['press-inclinado-barra', 'Press inclinado con barra', 'Pecho', 'Barra', ['press banca inclinado', 'incline bench press'], ['Tríceps', 'Hombros']],
    ['press-inclinado-mancuernas', 'Press inclinado con mancuernas', 'Pecho', 'Mancuernas', ['incline dumbbell press'], ['Tríceps', 'Hombros']],
    ['press-declinado-barra', 'Press declinado con barra', 'Pecho', 'Barra', ['decline bench press'], ['Tríceps']],
    ['press-declinado-mancuernas', 'Press declinado con mancuernas', 'Pecho', 'Mancuernas', ['decline dumbbell press'], ['Tríceps']],
    ['press-maquina-pecho', 'Press de pecho en máquina', 'Pecho', 'Máquina', ['chest press', 'machine chest press'], ['Tríceps', 'Hombros']],
    ['press-convergente', 'Press convergente en máquina', 'Pecho', 'Máquina', ['converging chest press'], ['Tríceps', 'Hombros']],
    ['press-smith', 'Press banca en multipower', 'Pecho', 'Multipower', ['smith machine bench press'], ['Tríceps', 'Hombros']],
    ['press-cerrado', 'Press banca con agarre cerrado', 'Tríceps', 'Barra', ['close grip bench press'], ['Pecho', 'Hombros']],
    ['press-suelo-mancuernas', 'Press en el suelo con mancuernas', 'Pecho', 'Mancuernas', ['floor press'], ['Tríceps']],
    ['apertura-mancuernas', 'Aperturas con mancuernas', 'Pecho', 'Mancuernas', ['dumbbell fly'], ['Hombros']],
    ['apertura-inclinada', 'Aperturas inclinadas con mancuernas', 'Pecho', 'Mancuernas', ['incline dumbbell fly'], ['Hombros']],
    ['cruce-polea-alta', 'Cruce de poleas de arriba abajo', 'Pecho', 'Polea', ['high to low cable fly'], ['Hombros']],
    ['cruce-polea-baja', 'Cruce de poleas de abajo arriba', 'Pecho', 'Polea', ['low to high cable fly'], ['Hombros']],
    ['pec-deck', 'Aperturas en máquina (pec deck)', 'Pecho', 'Máquina', ['pec deck', 'machine fly'], ['Hombros']],
    ['flexiones', 'Flexiones', 'Pecho', 'Peso corporal', ['push up', 'push-up'], ['Tríceps', 'Core']],
    ['fondos-pecho', 'Fondos inclinados para pecho', 'Pecho', 'Peso corporal', ['chest dips'], ['Tríceps', 'Hombros']],
    ['remo-sentado-polea', 'Remo sentado con cable', 'Espalda', 'Polea', ['seated cable row', 'remo en polea baja'], ['Bíceps', 'Hombros']],
    ['remo-barra', 'Remo inclinado con barra', 'Espalda', 'Barra', ['barbell row', 'bent over row'], ['Bíceps', 'Core']],
    ['remo-mancuerna', 'Remo con mancuerna a una mano', 'Espalda', 'Mancuerna', ['one arm dumbbell row'], ['Bíceps', 'Hombros']],
    ['remo-pecho-apoyado', 'Remo con pecho apoyado', 'Espalda', 'Máquina', ['chest supported row'], ['Bíceps']],
    ['remo-maquina', 'Remo sentado en máquina', 'Espalda', 'Máquina', ['machine row'], ['Bíceps', 'Hombros']],
    ['remo-landmine', 'Remo landmine', 'Espalda', 'Barra', ['meadows row', 't-bar row'], ['Bíceps', 'Core']],
    ['jalon-pecho', 'Jalón al pecho con agarre ancho', 'Espalda', 'Polea', ['lat pulldown', 'wide grip pulldown'], ['Bíceps', 'Hombros']],
    ['jalon-neutro', 'Jalón al pecho con agarre neutro', 'Espalda', 'Polea', ['neutral grip pulldown'], ['Bíceps']],
    ['jalon-unilateral', 'Jalón unilateral en polea', 'Espalda', 'Polea', ['single arm lat pulldown'], ['Bíceps']],
    ['pullover-polea', 'Pullover en polea', 'Espalda', 'Polea', ['straight arm pulldown'], ['Core']],
    ['dominadas', 'Dominadas', 'Espalda', 'Peso corporal', ['pull up', 'pull-up'], ['Bíceps', 'Core']],
    ['dominada-supina', 'Dominadas con agarre supino', 'Espalda', 'Peso corporal', ['chin up'], ['Bíceps']],
    ['hiperextensiones', 'Extensiones lumbares', 'Espalda', 'Banco', ['back extension', 'hyperextension'], ['Glúteos', 'Piernas']],
    ['encogimientos-mancuernas', 'Encogimientos con mancuernas', 'Espalda', 'Mancuernas', ['dumbbell shrug'], ['Antebrazos']],
    ['press-militar-barra', 'Press militar con barra', 'Hombros', 'Barra', ['overhead press', 'barbell shoulder press'], ['Tríceps', 'Core']],
    ['press-hombro-mancuernas', 'Press de hombros con mancuernas', 'Hombros', 'Mancuernas', ['dumbbell shoulder press'], ['Tríceps']],
    ['press-hombro-maquina', 'Press de hombros en máquina', 'Hombros', 'Máquina', ['machine shoulder press'], ['Tríceps']],
    ['press-arnold', 'Press Arnold', 'Hombros', 'Mancuernas', ['arnold press'], ['Tríceps']],
    ['elevacion-lateral-mancuerna', 'Elevación lateral con mancuernas', 'Hombros', 'Mancuernas', ['dumbbell lateral raise'], []],
    ['elevacion-lateral-polea', 'Elevación lateral en polea', 'Hombros', 'Polea', ['cable lateral raise'], []],
    ['elevacion-lateral-maquina', 'Elevación lateral en máquina', 'Hombros', 'Máquina', ['machine lateral raise'], []],
    ['elevacion-frontal', 'Elevación frontal con mancuernas', 'Hombros', 'Mancuernas', ['front raise'], ['Pecho']],
    ['pajaro-mancuernas', 'Pájaros con mancuernas', 'Hombros', 'Mancuernas', ['reverse fly', 'rear delt fly'], ['Espalda']],
    ['face-pull', 'Face pull en polea', 'Hombros', 'Polea', ['face pull'], ['Espalda']],
    ['remo-menton', 'Remo al mentón con barra', 'Hombros', 'Barra', ['upright row'], ['Bíceps']],
    ['curl-barra', 'Curl de bíceps con barra', 'Bíceps', 'Barra', ['barbell curl'], ['Antebrazos']],
    ['curl-z', 'Curl de bíceps con barra Z', 'Bíceps', 'Barra Z', ['ez bar curl'], ['Antebrazos']],
    ['curl-mancuernas', 'Curl alterno con mancuernas', 'Bíceps', 'Mancuernas', ['alternating dumbbell curl'], ['Antebrazos']],
    ['curl-martillo', 'Curl martillo', 'Bíceps', 'Mancuernas', ['hammer curl'], ['Antebrazos']],
    ['curl-predicador', 'Curl predicador en banco', 'Bíceps', 'Banco', ['preacher curl', 'curl scott'], ['Antebrazos']],
    ['curl-polea', 'Curl de bíceps en polea', 'Bíceps', 'Polea', ['cable bicep curl'], ['Antebrazos']],
    ['curl-inclinado', 'Curl inclinado con mancuernas', 'Bíceps', 'Banco', ['incline dumbbell curl'], ['Antebrazos']],
    ['curl-concentrado', 'Curl concentrado', 'Bíceps', 'Mancuerna', ['concentration curl'], []],
    ['extension-triceps-polea', 'Extensión de tríceps en polea', 'Tríceps', 'Polea', ['triceps pushdown', 'pushdown'], []],
    ['extension-triceps-cuerda', 'Extensión de tríceps con cuerda', 'Tríceps', 'Polea', ['rope pushdown'], []],
    ['extension-triceps-sobre-cabeza', 'Extensión de tríceps sobre la cabeza', 'Tríceps', 'Polea', ['overhead triceps extension'], ['Hombros']],
    ['extension-triceps-mancuerna', 'Extensión de tríceps con mancuerna', 'Tríceps', 'Mancuerna', ['dumbbell triceps extension'], ['Hombros']],
    ['press-frances', 'Press francés con barra Z', 'Tríceps', 'Barra Z', ['skull crusher', 'lying triceps extension'], ['Hombros']],
    ['fondos-triceps', 'Fondos para tríceps', 'Tríceps', 'Peso corporal', ['triceps dips'], ['Pecho', 'Hombros']],
    ['patada-triceps', 'Patada de tríceps con mancuerna', 'Tríceps', 'Mancuerna', ['triceps kickback'], []],
    ['sentadilla-barra', 'Sentadilla con barra', 'Piernas', 'Barra', ['back squat', 'barbell squat'], ['Glúteos', 'Core']],
    ['sentadilla-frontal', 'Sentadilla frontal', 'Piernas', 'Barra', ['front squat'], ['Glúteos', 'Core']],
    ['sentadilla-goblet', 'Sentadilla goblet', 'Piernas', 'Mancuerna', ['goblet squat'], ['Glúteos', 'Core']],
    ['sentadilla-smith', 'Sentadilla en multipower', 'Piernas', 'Multipower', ['smith machine squat'], ['Glúteos']],
    ['prensa-piernas', 'Prensa de piernas', 'Piernas', 'Máquina', ['leg press'], ['Glúteos']],
    ['prensa-unilateral', 'Prensa de piernas a una pierna', 'Piernas', 'Máquina', ['single leg press'], ['Glúteos']],
    ['hack-squat', 'Sentadilla hack en máquina', 'Piernas', 'Máquina', ['hack squat'], ['Glúteos']],
    ['extension-cuadriceps', 'Extensión de cuádriceps', 'Piernas', 'Máquina', ['leg extension'], []],
    ['curl-femoral-sentado', 'Curl femoral sentado', 'Piernas', 'Máquina', ['seated leg curl'], ['Glúteos']],
    ['curl-femoral-tumbado', 'Curl femoral tumbado', 'Piernas', 'Máquina', ['lying leg curl'], ['Glúteos']],
    ['peso-muerto-convencional', 'Peso muerto convencional', 'Piernas', 'Barra', ['deadlift'], ['Espalda', 'Glúteos']],
    ['peso-muerto-rumano', 'Peso muerto rumano', 'Piernas', 'Barra', ['romanian deadlift', 'rdl'], ['Glúteos', 'Espalda']],
    ['peso-muerto-mancuernas', 'Peso muerto rumano con mancuernas', 'Piernas', 'Mancuernas', ['dumbbell romanian deadlift'], ['Glúteos']],
    ['zancadas', 'Zancadas caminando', 'Piernas', 'Mancuernas', ['walking lunge'], ['Glúteos', 'Core']],
    ['sentadilla-bulgara', 'Sentadilla búlgara', 'Piernas', 'Mancuernas', ['bulgarian split squat'], ['Glúteos', 'Core']],
    ['step-up', 'Subida al cajón', 'Piernas', 'Banco', ['step up'], ['Glúteos', 'Core']],
    ['hip-thrust', 'Hip thrust con barra', 'Glúteos', 'Barra', ['barbell hip thrust'], ['Piernas', 'Core']],
    ['puente-gluteo', 'Puente de glúteo', 'Glúteos', 'Peso corporal', ['glute bridge'], ['Piernas']],
    ['abduccion-cadera', 'Abducción de cadera en máquina', 'Glúteos', 'Máquina', ['hip abduction'], ['Piernas']],
    ['aduccion-cadera', 'Aducción de cadera en máquina', 'Piernas', 'Máquina', ['hip adduction'], []],
    ['patada-gluteo-polea', 'Patada de glúteo en polea', 'Glúteos', 'Polea', ['cable kickback'], ['Piernas']],
    ['gemelo-de-pie', 'Elevación de gemelos de pie', 'Piernas', 'Máquina', ['standing calf raise'], []],
    ['gemelo-sentado', 'Elevación de gemelos sentado', 'Piernas', 'Máquina', ['seated calf raise'], []],
    ['plancha', 'Plancha', 'Core', 'Peso corporal', ['plank'], ['Hombros']],
    ['crunch', 'Crunch abdominal', 'Core', 'Peso corporal', ['ab crunch'], []],
    ['crunch-polea', 'Crunch en polea', 'Core', 'Polea', ['cable crunch'], []],
    ['elevacion-piernas', 'Elevación de piernas', 'Core', 'Peso corporal', ['leg raise'], ['Hombros']],
    ['rueda-abdominal', 'Rueda abdominal', 'Core', 'Rueda', ['ab wheel rollout'], ['Hombros']],
    ['pallof-press', 'Press Pallof', 'Core', 'Polea', ['pallof press'], ['Hombros']],
    ['cinta-correr', 'Correr en cinta', 'Cardio', 'Máquina', ['treadmill run'], ['Piernas']],
    ['bicicleta-estatica', 'Bicicleta estática', 'Cardio', 'Máquina', ['stationary bike'], ['Piernas']],
    ['eliptica', 'Elíptica', 'Cardio', 'Máquina', ['elliptical'], ['Piernas']],
    ['remo-ergometro', 'Remo en ergómetro', 'Cardio', 'Máquina', ['rowing machine'], ['Espalda', 'Piernas']],
    ['cuerda-saltar', 'Saltar a la comba', 'Cardio', 'Cuerda', ['jump rope'], ['Piernas']],
  ];
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
  const exercises = rows.map(([id, name, muscle, equipment, aliases, secondary]) => Object.freeze({ id, name, muscle, equipment, aliases: Object.freeze(aliases), secondary: Object.freeze(secondary) }));

  // Todas las palabras escritas deben aparecer en el nombre, grupo, material o alias.
  function search(query = '', filters = {}) {
    const words = normalize(query).split(' ').filter(Boolean);
    return exercises.filter(ex => {
      if (filters.muscle && ex.muscle !== filters.muscle) return false;
      if (filters.equipment && ex.equipment !== filters.equipment) return false;
      const text = normalize([ex.name, ex.muscle, ex.equipment, ...ex.aliases].join(' '));
      return words.every(word => text.includes(word));
    });
  }

  return Object.freeze({ exercises: Object.freeze(exercises), normalize, search });
});
