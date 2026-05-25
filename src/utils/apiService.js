export default class ApiService {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async post(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log("POST response text:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        throw new Error("Invalid JSON response: " + text);
      }
    } catch (err) {
      console.error("Error POST:", err);
      throw err;
    }
  }

  async get(endpoint) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      const text = await response.text();
      console.log("GET response text:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        throw new Error("Invalid JSON response: " + text);
      }
    } catch (err) {
      console.error("Error GET:", err);
      throw err;
    }
  }

  // TAMBAHAN: Method PUT untuk update
  async put(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log("PUT response text:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        throw new Error("Invalid JSON response: " + text);
      }
    } catch (err) {
      console.error("Error PUT:", err);
      throw err;
    }
  }

  // TAMBAHAN: Method DELETE untuk hapus
  async delete(endpoint, data) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const text = await response.text();
      console.log("DELETE response text:", text);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      try {
        return JSON.parse(text);
      } catch (parseErr) {
        console.error("JSON parse error:", parseErr);
        throw new Error("Invalid JSON response: " + text);
      }
    } catch (err) {
      console.error("Error DELETE:", err);
      throw err;
    }
  }
}