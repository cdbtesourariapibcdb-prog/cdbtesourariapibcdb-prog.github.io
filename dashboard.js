document.addEventListener("DOMContentLoaded", async () => {
  try {
    const dados = await jsonpCall({ action: "dashboard" });

    if (!dados) return;

    document.getElementById("totalEntradas").innerText = dados.totalEntradas;
    document.getElementById("totalSaidas").innerText = dados.totalSaidas;
    document.getElementById("saldoFinal").innerText = dados.saldo;

    carregarGraficoMensal(dados.graficoMensal);
    carregarGraficoCategorias(dados.graficoCategorias);

  } catch (e) {
    console.error("Erro dashboard:", e);
  }
});

function carregarGraficoMensal(dataset){
  new Chart(document.getElementById("graficoMensal"), {
    type: "line",
    data: {
      labels: dataset.labels,
      datasets: [{
        label: "Saldo Mensal",
        data: dataset.valores
      }]
    }
  });
}

function carregarGraficoCategorias(dataset){
  new Chart(document.getElementById("graficoCategorias"), {
    type: "pie",
    data: {
      labels: dataset.labels,
      datasets: [{
        data: dataset.valores
      }]
    }
  });
}
