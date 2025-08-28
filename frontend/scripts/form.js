document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("riskForm");
  const resultBox = document.getElementById("resultBox");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const rawData = Object.fromEntries(formData.entries());

    // Convert numeric fields to numbers and include all radio fields
    const data = {
      age: parseFloat(rawData.age),
      temperature: parseFloat(rawData.temperature),
      platelets: parseFloat(rawData.platelets),
      bmi: parseFloat(rawData.bmi),
      trauma: rawData.trauma,
      vt_history: rawData.vt_history,
      cancer: rawData.cancer,
      lung: rawData.lung,
      renal: rawData.renal,
      diabetes: rawData.diabetes,
      edema: rawData.edema,
      immobility: rawData.immobility,
      pneumonia: rawData.pneumonia,
      af: rawData.af
    };

    try {
      resultBox.style.display = "block";
      resultBox.style.color = "#ccc";
      resultBox.innerHTML = "⏳ Predicting risk...";

      const response = await fetch(CONFIG.API_BASE_URL + CONFIG.ENDPOINTS.PREDICT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.error) {
        resultBox.innerHTML = `❌ ${result.error}`;
        resultBox.style.color = "crimson";
      } else {
        const riskColor =
          result.risk_level === "Severe Risk" ? "darkred" :
          result.risk_level === "High Risk" ? "orangered" :
          result.risk_level === "Medium Risk" ? "orange" : "limegreen";

        resultBox.innerHTML = `
          ✅ ${result.message}<br>
          <strong style="color:${riskColor}; font-size:1.2rem">${result.risk_level}</strong>
        `;
      }

    } catch (err) {
      console.error("❌ Error fetching result", err);
      resultBox.innerHTML = "❌ Server error. Try again.";
      resultBox.style.color = "red";
    }
  });
});
