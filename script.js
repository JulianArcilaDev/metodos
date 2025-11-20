document.addEventListener('DOMContentLoaded', () => {
  const methodSelect = document.getElementById('method');
  const xInput = document.getElementById('x-values');
  const fxInput = document.getElementById('fx-values');
  const calculateBtn = document.getElementById('calculate');
  const resultDiv = document.getElementById('result');

  calculateBtn.addEventListener('click', () => {
    const method = methodSelect.value;
    const xStr = xInput.value.trim();
    const fxStr = fxInput.value.trim();

    // Limpiar resultados anteriores
    resultDiv.innerHTML = '';
    resultDiv.className = '';

    // Validar que no estén vacíos
    if (!xStr || !fxStr) {
      showError('Por favor, ingresa ambos conjuntos de valores: x y f(x).');
      return;
    }

    let x, fx;
    try {
      x = parseNumbers(xStr);
      fx = parseNumbers(fxStr);
    } catch (e) {
      showError('Error: Asegúrate de ingresar solo números separados por comas.');
      return;
    }

    if (x.length !== fx.length) {
      showError('Error: Los vectores x y f(x) deben tener la misma longitud.');
      return;
    }

    if (x.length < 2) {
      showError('Error: Se requieren al menos 2 puntos.');
      return;
    }

    // Verificar que x esté en orden creciente
    for (let i = 1; i < x.length; i++) {
      if (x[i] <= x[i - 1]) {
        showError('Error: Los valores de x deben estar en orden creciente y sin repeticiones.');
        return;
      }
    }

    let result;
    try {
      if (method === 'trapecio') {
        result = trapecio(x, fx);
      } else if (method === 'simpson38') {
        if ((x.length - 1) % 3 !== 0) {
          showError('Error: Para Simpson 3/8, el número de intervalos (n) debe ser múltiplo de 3.<br>Ej: 4, 7, 10, ... puntos.');
          return;
        }
        // Verificar espaciado uniforme para Simpson 3/8
        if (!esEquiespaciado(x)) {
          showError('Error: Simpson 3/8 requiere puntos equiespaciados.');
          return;
        }
        result = simpson38(x, fx);
      }
    } catch (e) {
      showError('Error durante el cálculo: ' + e.message);
      return;
    }

    showResult(result);
  });

  function parseNumbers(str) {
    return str.split(',')
      .map(s => s.trim())
      .filter(s => s !== '')
      .map(s => {
        const num = parseFloat(s);
        if (isNaN(num)) throw new Error('Valor no numérico: ' + s);
        return num;
      });
  }

  function esEquiespaciado(x) {
    if (x.length < 2) return true;
    const h = x[1] - x[0];
    for (let i = 2; i < x.length; i++) {
      if (Math.abs((x[i] - x[i-1]) - h) > 1e-9) {
        return false;
      }
    }
    return true;
  }

  function trapecio(x, fx) {
    let integral = 0;
    const n = x.length - 1;
    
    for (let i = 0; i < n; i++) {
      const h = x[i + 1] - x[i];
      integral += (h / 2) * (fx[i] + fx[i + 1]);
    }
    return integral;
  }

  function simpson38(x, fx) {
    const n = x.length - 1; // número de intervalos
    if (n % 3 !== 0) {
      throw new Error('Simpson 3/8 requiere que el número de intervalos sea múltiplo de 3.');
    }

    let integral = 0;
    const h = (x[n] - x[0]) / n; // paso uniforme

    for (let i = 0; i < n; i += 3) {
      integral += (3 * h / 8) * (
        fx[i] + 
        3 * fx[i + 1] + 
        3 * fx[i + 2] + 
        fx[i + 3]
      );
    }
    return integral;
  }

  function showError(message) {
    resultDiv.innerHTML = `<p class="error">${message}</p>`;
    resultDiv.classList.add('show', 'error');
  }

  function showResult(value) {
    resultDiv.innerHTML = `
      <p class="success">Resultado de la integral ≈ <strong>${value.toFixed(6)}</strong></p>
      <p class="note">Valor redondeado a 6 decimales.</p>
    `;
    resultDiv.classList.add('show', 'success');
  }

  // Ejemplos de uso pre-cargados para facilitar las pruebas
  function cargarEjemplo(method) {
    if (method === 'trapecio') {
      xInput.value = '0, 1, 2, 3';
      fxInput.value = '1, 2.718, 7.389, 20.085';
    } else if (method === 'simpson38') {
      xInput.value = '0, 1, 2, 3, 4, 5, 6';
      fxInput.value = '1, 2.718, 7.389, 20.085, 54.598, 148.413, 403.429';
    }
  }

  // Cargar ejemplo cuando se cambie el método
  methodSelect.addEventListener('change', () => {
    cargarEjemplo(methodSelect.value);
  });

  // Cargar ejemplo inicial
  cargarEjemplo(methodSelect.value);
});