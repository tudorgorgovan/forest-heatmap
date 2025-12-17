document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("health-btn");
  const statusEl = document.getElementById("health-status");
  if (!button || !statusEl) {
    return;
  }

  // Create a temporary client that knows how to talk to the ZebraHack API.
  const zebraApi = ZebraHackApi.createClient({
    // Replace with your team name
    appKey: "LoveLinux++",
  });

  // Runs the health-check when the button is clicked, updating the status text.
  const runHealthCheck = async (event) => {
    if (event && typeof event.preventDefault === "function") {
      event.preventDefault();
    }
    statusEl.textContent = "Checking health...";
    try {
      const result = await zebraApi.health();
      statusEl.textContent = `Health: ${JSON.stringify(result)}`;
    } catch (err) {
      statusEl.textContent = `Health check failed: ${err.message}`;
    }
  };

  // --- Launch Button Logic ---
  const launchBtn = document.getElementById("launch-btn");
  if (launchBtn) {
    // Initial state is Red (handled by inline style or default class, but let's be explicit)
    // We already set inline style to red in HTML.

    const updateLaunchButton = async () => {
      try {
        await zebraApi.health();
        // If successful, turn Green
        launchBtn.classList.remove("btn-status-red");
        launchBtn.classList.add("btn-status-green");
        launchBtn.title = "System Online";
      } catch (error) {
        // If failed, stay Red
        console.error("Health check failed:", error);
        launchBtn.classList.remove("btn-status-green");
        launchBtn.classList.add("btn-status-red");
        launchBtn.title = "System Offline";
      }
    };

    // Check immediately
    updateLaunchButton();


  }

  // --- End Launch Button Logic ---

  button.addEventListener("click", runHealthCheck);
});
