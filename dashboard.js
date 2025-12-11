document.addEventListener("DOMContentLoaded", async () => {
  try {
    const dados = await jsonpCall({ action: "dashboard" });

    if (!dados) {
      console.error("Dados do dashboard não recebidos");
      return;
    }

    document.getElementById("totalEntradas").innerText = dados.totalEntradas;
    document.getElementById("totalSaidas").innerText = dados.totalSaidas;
    document.getElementById("saldoFinal").innerText = dados.saldo;

    carregarGraficoMensal(dados.graficoMensal);
    carregarGraficoCategorias(dados.graficoCategorias);

  } catch (e) {
    console.error("Erro ao carregar dashboard", e);
  }
});

function carregarGraficoMensal(dataset){
  console.log("Gráfico mensal:", dataset);
  // Aqui você coloca sua lib gráfica (Chart.js etc.)
}

function carregarGraficoCategorias(dataset){
  console.log("Gráfico categorias:", dataset);
}
