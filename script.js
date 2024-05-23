const dias = 30; // Número de dias
const minContratosPorDia = 10; // Quantidade mínima de contratos por dia
const maxContratosPorDia = 30; // Quantidade máxima de contratos por dia
const maxValorContrato = 1000; // Valor máximo de um contrato

const distribuicaoMensal = {
  total: { fund1: 0, fund2: 0, fund3: 0, soma: 0, contratos: 0 },
};
const contratosPorFundo = Array.from({ length: dias }, () => ({
  fund1: 0,
  fund2: 0,
  fund3: 0,
}));

// Função para gerar valores aleatórios para contratos e quantidade de contratos por dia
function gerarValoresAleatorios(
  dias,
  minContratosPorDia,
  maxContratosPorDia,
  maxValor
) {
  const totalContratos = [];
  for (let dia = 1; dia <= dias; dia++) {
    const quantidadeContratos =
      Math.floor(
        Math.random() * (maxContratosPorDia - minContratosPorDia + 1)
      ) + minContratosPorDia;
    const contratos = [];
    for (let i = 0; i < quantidadeContratos; i++) {
      contratos.push(Math.floor(Math.random() * maxValor) + 1);
    }
    totalContratos.push({
      dia: dia,
      quantidade: quantidadeContratos,
      contratos: contratos,
    });
  }
  return totalContratos;
}

const totalContratos = gerarValoresAleatorios(
  dias,
  minContratosPorDia,
  maxContratosPorDia,
  maxValorContrato
);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatarValor(valor) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calcularDesvio(porcentagem, valorDistribuido, somaContratos) {
  const porcentagemReal = (valorDistribuido / somaContratos) * 100;
  const desvio = porcentagemReal - porcentagem;
  return {
    porcentagemReal: porcentagemReal.toFixed(2) + "%",
    desvio: desvio.toFixed(2) + "%",
  };
}

async function distribuir(contratos, dia, porcentagens, fundoReserva) {
  const somaContratos = contratos.contratos.reduce(
    (total, contrato) => total + contrato,
    0
  );
  const valoresDistribuidos = porcentagens.map(
    (porcentagem) => (somaContratos * porcentagem) / 100
  );

  const distribuicaoDiaria = {
    fund1: 0,
    fund2: 0,
    fund3: 0,
    contratos: contratos.quantidade,
    quantidadeFund1: 0,
    quantidadeFund2: 0,
    quantidadeFund3: 0,
  };

  let totalDistribuido = 0;
  let contratosFund1 = [];
  let contratosFund2 = [];
  let contratosFund3 = [];

  // Distribuir contratos para atingir os valores calculados
  contratos.contratos.forEach((valorContrato) => {
    if (distribuicaoDiaria.fund1 < valoresDistribuidos[0]) {
      distribuicaoDiaria.fund1 += valorContrato;
      distribuicaoDiaria.quantidadeFund1 += 1;
      contratosFund1.push(valorContrato);
    } else if (distribuicaoDiaria.fund2 < valoresDistribuidos[1]) {
      distribuicaoDiaria.fund2 += valorContrato;
      distribuicaoDiaria.quantidadeFund2 += 1;
      contratosFund2.push(valorContrato);
    } else {
      distribuicaoDiaria.fund3 += valorContrato;
      distribuicaoDiaria.quantidadeFund3 += 1;
      contratosFund3.push(valorContrato);
    }
    totalDistribuido += valorContrato;
  });

  // Ajustar os desvios no fundo reserva
  const desvioFund1 = calcularDesvio(
    porcentagens[0],
    distribuicaoDiaria.fund1,
    somaContratos
  ).desvio;
  const desvioFund2 = calcularDesvio(
    porcentagens[1],
    distribuicaoDiaria.fund2,
    somaContratos
  ).desvio;
  const desvioFund3 = calcularDesvio(
    porcentagens[2],
    distribuicaoDiaria.fund3,
    somaContratos
  ).desvio;

  if (fundoReserva === "fund1") {
    distribuicaoDiaria.fund1 +=
      desvioFund2 > 0 ? distribuicaoDiaria.fund2 * (desvioFund2 / 100) : 0;
    distribuicaoDiaria.fund1 +=
      desvioFund3 > 0 ? distribuicaoDiaria.fund3 * (desvioFund3 / 100) : 0;
  } else if (fundoReserva === "fund2") {
    distribuicaoDiaria.fund2 +=
      desvioFund1 > 0 ? distribuicaoDiaria.fund1 * (desvioFund1 / 100) : 0;
    distribuicaoDiaria.fund2 +=
      desvioFund3 > 0 ? distribuicaoDiaria.fund3 * (desvioFund3 / 100) : 0;
  } else if (fundoReserva === "fund3") {
    distribuicaoDiaria.fund3 +=
      desvioFund1 > 0 ? distribuicaoDiaria.fund1 * (desvioFund1 / 100) : 0;
    distribuicaoDiaria.fund3 +=
      desvioFund2 > 0 ? distribuicaoDiaria.fund2 * (desvioFund2 / 100) : 0;
  }

  distribuicaoMensal[dia] = distribuicaoDiaria;

  contratosPorFundo[dia - 1].fund1 += distribuicaoDiaria.quantidadeFund1;
  contratosPorFundo[dia - 1].fund2 += distribuicaoDiaria.quantidadeFund2;
  contratosPorFundo[dia - 1].fund3 += distribuicaoDiaria.quantidadeFund3;

  distribuicaoMensal.total.fund1 += distribuicaoDiaria.fund1;
  distribuicaoMensal.total.fund2 += distribuicaoDiaria.fund2;
  distribuicaoMensal.total.fund3 += distribuicaoDiaria.fund3;
  distribuicaoMensal.total.soma += totalDistribuido;
  distribuicaoMensal.total.contratos += contratos.quantidade;

  exibirDistribuicao(dia, somaContratos, porcentagens, fundoReserva);
  await sleep(500); // Delay de 500ms entre cada dia para visualização
}

function exibirDistribuicao(dia, somaContratos, porcentagens, fundoReserva) {
  const tableBody = document.querySelector("#distributionTable tbody");

  if (dia) {
    const distribuicaoDiaria = distribuicaoMensal[dia];
    const totalDia =
      distribuicaoDiaria.fund1 +
      distribuicaoDiaria.fund2 +
      distribuicaoDiaria.fund3;
    const desvioFund1 = calcularDesvio(
      porcentagens[0],
      distribuicaoDiaria.fund1,
      somaContratos
    );
    const desvioFund2 = calcularDesvio(
      porcentagens[1],
      distribuicaoDiaria.fund2,
      somaContratos
    );
    const desvioFund3 = calcularDesvio(
      porcentagens[2],
      distribuicaoDiaria.fund3,
      somaContratos
    );

    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${dia}</td>
            <td>${distribuicaoDiaria.contratos}</td>
            <td>${formatarValor(distribuicaoDiaria.fund1)} (${
      distribuicaoDiaria.quantidadeFund1
    } contratos, ${desvioFund1.porcentagemReal}, desvio: ${
      desvioFund1.desvio
    })</td>
            <td>${formatarValor(distribuicaoDiaria.fund2)} (${
      distribuicaoDiaria.quantidadeFund2
    } contratos, ${desvioFund2.porcentagemReal}, desvio: ${
      desvioFund2.desvio
    })</td>
            <td>${formatarValor(distribuicaoDiaria.fund3)} (${
      distribuicaoDiaria.quantidadeFund3
    } contratos, ${desvioFund3.porcentagemReal}, desvio: ${
      desvioFund3.desvio
    })</td>
            <td>${formatarValor(totalDia)}</td>
        `;

    tableBody.appendChild(row);
  } else {
    tableBody.innerHTML = "";

    for (let dia = 1; dia <= 30; dia++) {
      if (distribuicaoMensal[dia]) {
        const distribuicaoDiaria = distribuicaoMensal[dia];
        const totalDia =
          distribuicaoDiaria.fund1 +
          distribuicaoDiaria.fund2 +
          distribuicaoDiaria.fund3;
        const desvioFund1 = calcularDesvio(
          porcentagens[0],
          distribuicaoDiaria.fund1,
          distribuicaoDiaria.fund1 +
            distribuicaoDiaria.fund2 +
            distribuicaoDiaria.fund3
        );
        const desvioFund2 = calcularDesvio(
          porcentagens[1],
          distribuicaoDiaria.fund2,
          distribuicaoDiaria.fund1 +
            distribuicaoDiaria.fund2 +
            distribuicaoDiaria.fund3
        );
        const desvioFund3 = calcularDesvio(
          porcentagens[2],
          distribuicaoDiaria.fund3,
          distribuicaoDiaria.fund1 +
            distribuicaoDiaria.fund2 +
            distribuicaoDiaria.fund3
        );

        const row = document.createElement("tr");

        row.innerHTML = `
                    <td>${dia}</td>
                    <td>${distribuicaoDiaria.contratos}</td>
                    <td>${formatarValor(distribuicaoDiaria.fund1)} (${
          desvioFund1.porcentagemReal
        }, desvio: ${desvioFund1.desvio})</td>
                    <td>${formatarValor(distribuicaoDiaria.fund2)} (${
          desvioFund2.porcentagemReal
        }, desvio: ${desvioFund2.desvio})</td>
                    <td>${formatarValor(distribuicaoDiaria.fund3)} (${
          desvioFund3.porcentagemReal
        }, desvio: ${desvioFund3.desvio})</td>
                    <td>${formatarValor(totalDia)}</td>
                `;

        tableBody.appendChild(row);
      }
    }

    const totalSoma = distribuicaoMensal.total.soma;
    const totalFund1 = distribuicaoMensal.total.fund1;
    const totalFund2 = distribuicaoMensal.total.fund2;
    const totalFund3 = distribuicaoMensal.total.fund3;
    const totalContratos = distribuicaoMensal.total.contratos;

    const porcentagemFund1 = ((totalFund1 / totalSoma) * 100).toFixed(2);
    const porcentagemFund2 = ((totalFund2 / totalSoma) * 100).toFixed(2);
    const porcentagemFund3 = ((totalFund3 / totalSoma) * 100).toFixed(2);

    const totalRow = document.createElement("tr");
    totalRow.innerHTML = `
            <td><strong>Total</strong></td>
            <td>${totalContratos}</td>
            <td><strong>${formatarValor(
              totalFund1
            )} (${porcentagemFund1}%)</strong></td>
            <td><strong>${formatarValor(
              totalFund2
            )} (${porcentagemFund2}%)</strong></td>
            <td><strong>${formatarValor(
              totalFund3
            )} (${porcentagemFund3}%)</strong></td>
            <td><strong>${formatarValor(totalSoma)}</strong></td>
        `;
    tableBody.appendChild(totalRow);
  }
}

function verificarPorcentagens() {
  const porcentagem1 = parseInt(document.getElementById("percentage1").value);
  const porcentagem2 = parseInt(document.getElementById("percentage2").value);
  const porcentagem3 = parseInt(document.getElementById("percentage3").value);
  const totalPorcentagem = porcentagem1 + porcentagem2 + porcentagem3;

  return totalPorcentagem;
}

async function iniciarDistribuicao() {
  const errorMessage = document.getElementById("error-message");
  const totalPorcentagem = verificarPorcentagens();
  const fundoReserva = document.getElementById("reserveFund").value;

  if (totalPorcentagem > 100) {
    errorMessage.textContent =
      "A soma das porcentagens não pode ultrapassar 100%.";
    return;
  } else {
    errorMessage.textContent = "";
  }

  const porcentagem1 = parseInt(document.getElementById("percentage1").value);
  const porcentagem2 = parseInt(document.getElementById("percentage2").value);
  const porcentagem3 = parseInt(document.getElementById("percentage3").value);
  const porcentagens = [porcentagem1, porcentagem2, porcentagem3];

  distribuicaoMensal.total = {
    fund1: 0,
    fund2: 0,
    fund3: 0,
    soma: 0,
    contratos: 0,
  }; // Resetar os totais

  for (const total of totalContratos) {
    await distribuir(total, total.dia, porcentagens, fundoReserva);
  }
  exibirDistribuicao(null, null, porcentagens, fundoReserva); // Exibir o total final
}

function criarOpcoesParaSelect(id) {
  const select = document.getElementById(id);
  for (let i = 0; i <= 100; i += 5) {
    const option = document.createElement("option");
    option.value = i;
    option.text = i + "%";
    select.appendChild(option);
  }
}

criarOpcoesParaSelect("percentage1");
criarOpcoesParaSelect("percentage2");
criarOpcoesParaSelect("percentage3");
