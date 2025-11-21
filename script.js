document.addEventListener('DOMContentLoaded', () => {
  const methodSelect = document.getElementById('method');
  const inputModeSelect = document.getElementById('input-mode');
  const functionInputs = document.getElementById('function-inputs');
  const valuesInputs = document.getElementById('values-inputs');
  const functionInput = document.getElementById('function-input');
  const aInput = document.getElementById('a-value');
  const bInput = document.getElementById('b-value');
  const nInput = document.getElementById('n-value');
  const xInput = document.getElementById('x-values');
  const fxInput = document.getElementById('fx-values');
  const calculateBtn = document.getElementById('calculate');
  const resultDiv = document.getElementById('result');

  // Cambiar entre modo función y modo valores
  inputModeSelect.addEventListener('change', () => {
    // Limpiar resultados al cambiar de modo
    resultDiv.innerHTML = '';
    resultDiv.className = '';
    
    if (inputModeSelect.value === 'function') {
      functionInputs.style.display = 'flex';
      valuesInputs.style.display = 'none';
      cargarEjemploFuncion(methodSelect.value);
    } else {
      functionInputs.style.display = 'none';
      valuesInputs.style.display = 'flex';
      cargarEjemploValores(methodSelect.value);
    }
  });

  // Cargar ejemplos cuando cambia el método
  methodSelect.addEventListener('change', () => {
    if (inputModeSelect.value === 'function') {
      cargarEjemploFuncion(methodSelect.value);
    } else {
      cargarEjemploValores(methodSelect.value);
    }
  });

  // Botón calcular
  calculateBtn.addEventListener('click', () => {
    const method = methodSelect.value;
    const mode = inputModeSelect.value;

    // Limpiar resultados anteriores
    resultDiv.innerHTML = '';
    resultDiv.className = '';

    try {
      let result;
      
      if (mode === 'function') {
        // Modo función
        const funcStr = functionInput.value.trim();
        const a = parseFloat(aInput.value.trim());
        const b = parseFloat(bInput.value.trim());
        const n = parseInt(nInput.value.trim());

        // Validaciones
        if (!funcStr) {
          showError('Por favor, ingresa una función f(x).');
          return;
        }

        if (isNaN(a) || isNaN(b) || isNaN(n)) {
          showError('Por favor, ingresa valores numéricos válidos para a, b y n.');
          return;
        }

        if (a >= b) {
          showError('El límite inferior (a) debe ser menor que el límite superior (b).');
          return;
        }

        if (n <= 0) {
          showError('El número de subintervalos debe ser mayor a 0.');
          return;
        }

        if (method === 'simpson38' && n % 3 !== 0) {
          showError('Para Simpson 3/8, el número de subintervalos (n) debe ser múltiplo de 3.');
          return;
        }

        // Generar puntos y evaluar función
        const h = (b - a) / n;
        const x = [];
        const fx = [];

        // Generar puntos equiespaciados
        for (let i = 0; i <= n; i++) {
          x.push(a + i * h);
        }

        // Evaluar función en cada punto
        for (let i = 0; i <= n; i++) {
          try {
            const valor = evaluarFuncion(funcStr, x[i]);
            if (!isFinite(valor)) {
              showError(`La función produce valores no finitos en x = ${x[i].toFixed(4)}`);
              return;
            }
            fx.push(valor);
          } catch (e) {
            showError(`Error al evaluar la función en x = ${x[i].toFixed(4)}: ${e.message}`);
            return;
          }
        }

        // Aplicar método seleccionado
        if (method === 'trapecio') {
          result = trapecio(x, fx);
        } else if (method === 'simpson38') {
          result = simpson38(x, fx);
        }

      } else {
        // Modo valores tabulados
        const xStr = xInput.value.trim();
        const fxStr = fxInput.value.trim();

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

        if (method === 'trapecio') {
          result = trapecio(x, fx);
        } else if (method === 'simpson38') {
          if ((x.length - 1) % 3 !== 0) {
            showError('Error: Para Simpson 3/8, el número de intervalos (n) debe ser múltiplo de 3.<br>Ej: 4, 7, 10, ... puntos.');
            return;
          }
          if (!esEquiespaciado(x)) {
            showError('Error: Simpson 3/8 requiere puntos equiespaciados.');
            return;
          }
          result = simpson38(x, fx);
        }
      }

      showResult(result);
    } catch (e) {
      showError('Error durante el cálculo: ' + e.message);
    }
  });

  // ===============================================
  // FUNCIONES AUXILIARES
  // ===============================================

  /**
   * Evalúa una expresión matemática en un punto x dado
   */
  function evaluarFuncion(funcStr, x) {
    // Reemplazar funciones matemáticas comunes por funciones de Math
    let expr = funcStr.toLowerCase()
      .replace(/\^/g, '**')                    // Potencia
      .replace(/sqrt/g, 'Math.sqrt')           // Raíz cuadrada
      .replace(/sin/g, 'Math.sin')             // Seno
      .replace(/cos/g, 'Math.cos')             // Coseno
      .replace(/tan/g, 'Math.tan')             // Tangente
      .replace(/exp/g, 'Math.exp')             // Exponencial
      .replace(/ln/g, 'Math.log')              // Logaritmo natural
      .replace(/log/g, 'Math.log10')           // Logaritmo base 10
      .replace(/abs/g, 'Math.abs')             // Valor absoluto
      .replace(/pi/g, 'Math.PI')               // Constante PI
      .replace(/e\b/g, 'Math.E');              // Constante e

    // Reemplazar x por el valor numérico
    expr = expr.replace(/x/g, `(${x})`);

    try {
      // Evaluar la expresión usando eval (con precaución)
      const result = eval(expr);
      return result;
    } catch (e) {
      throw new Error('Sintaxis inválida en la función');
    }
  }

  /**
   * Convierte una cadena de números separados por comas en un array
   */
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

  /**
   * Verifica si un array de puntos está equiespaciado
   */
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

  // ===============================================
  // MÉTODOS DE INTEGRACIÓN NUMÉRICA
  // ===============================================

  /**
   * Regla del Trapecio (compuesta)
   * Aproxima la integral usando trapecios
   */
  function trapecio(x, fx) {
    let integral = 0;
    const n = x.length - 1;
    
    // Sumar el área de cada trapecio
    for (let i = 0; i < n; i++) {
      const h = x[i + 1] - x[i];
      integral += (h / 2) * (fx[i] + fx[i + 1]);
    }
    
    return integral;
  }

  /**
   * Regla de Simpson 3/8 (compuesta)
   * Aproxima la integral usando polinomios cúbicos
   */
  function simpson38(x, fx) {
    const n = x.length - 1; // número de intervalos
    
    if (n % 3 !== 0) {
      throw new Error('Simpson 3/8 requiere que el número de intervalos sea múltiplo de 3.');
    }

    let integral = 0;
    const h = (x[n] - x[0]) / n; // paso uniforme

    // Aplicar la fórmula de Simpson 3/8 por bloques de 3 intervalos
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

  // ===============================================
  // FUNCIONES DE INTERFAZ
  // ===============================================

  /**
   * Muestra un mensaje de error
   */
  function showError(message) {
    resultDiv.innerHTML = `<p class="error">${message}</p>`;
    resultDiv.classList.add('show', 'error');
  }

  /**
   * Muestra el resultado de la integral
   */
  function showResult(value) {
    resultDiv.innerHTML = `
      <p class="success">Resultado de la integral ≈ <strong>${value.toFixed(6)}</strong></p>
      <p class="note">Valor redondeado a 6 decimales.</p>
    `;
    resultDiv.classList.add('show', 'success');
  }

  /**
   * Carga un ejemplo de función según el método seleccionado
   */
  function cargarEjemploFuncion(method) {
    if (method === 'trapecio') {
      functionInput.value = 'exp(x)';
      aInput.value = '0';
      bInput.value = '3';
      nInput.value = '3';
    } else if (method === 'simpson38') {
      functionInput.value = 'exp(x)';
      aInput.value = '0';
      bInput.value = '6';
      nInput.value = '6';
    }
  }

  /**
   * Carga un ejemplo de valores tabulados según el método seleccionado
   */
  function cargarEjemploValores(method) {
    if (method === 'trapecio') {
      xInput.value = '0, 1, 2, 3';
      fxInput.value = '1, 2.718, 7.389, 20.085';
    } else if (method === 'simpson38') {
      xInput.value = '0, 1, 2, 3, 4, 5, 6';
      fxInput.value = '1, 2.718, 7.389, 20.085, 54.598, 148.413, 403.429';
    }
  }

  // ===============================================
  // INICIALIZACIÓN
  // ===============================================

  // Cargar ejemplo inicial al cargar la página
  cargarEjemploFuncion(methodSelect.value);
});