// Utilidad global para manejo de fechas y estaciones (Hemisferio Sur)
export function obtenerEstacionActual() {
  const mes = new Date().getMonth() + 1; // 1 a 12
  const dia = new Date().getDate();

  // Verano: 21 de Diciembre (12/21) hasta 20 de Marzo (3/20)
  // Otoño: 21 de Marzo hasta 20 de Junio
  // Invierno: 21 de Junio hasta 20 de Septiembre
  // Primavera: 21 de Septiembre hasta 20 de Diciembre

  if ((mes === 12 && dia >= 21) || mes === 1 || mes === 2 || (mes === 3 && dia <= 20)) {
    return 'VERANO';
  } else if ((mes === 3 && dia >= 21) || mes === 4 || mes === 5 || (mes === 6 && dia <= 20)) {
    return 'OTONIO';
  } else if ((mes === 6 && dia >= 21) || mes === 7 || mes === 8 || (mes === 9 && dia <= 20)) {
    return 'INVIERNO';
  } else {
    return 'PRIMAVERA';
  }
}

// Formateador de fechas estándar para el historial de compras
export function obtenerFechaActualISO() {
  return new Date().toISOString().split('T')[0];
}