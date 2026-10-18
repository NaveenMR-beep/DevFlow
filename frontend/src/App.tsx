
import { useEffect, useState, type FormEvent } from "react";
import "./App.css";
import Login from "./pages/Login";
import Register from "./pages/Register";

const API = "http://127.0.0.1:8000";

type Project = {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
};

type User = {
  id: number;
  username: string;
  email: string;
};

type Page = "login" | "register" | "dashboard";

function App() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem("devflow_token")
  );
  const [page, setPage] = useState<Page>(() =>
    sessionStorage.getItem("devflow_token") ? "dashboard" : "login"
  );

  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [message, setMessage] = useState(
    "Welcome to your DevFlow workspace!"
  );
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "projects" | "profile"
  >("dashboard");

  function handleLogout() {
    sessionStorage.removeItem("devflow_token");
    setToken(null);
    setUser(null);
    setProjects([]);
    setSearchTerm("");
    setPage("login");
    setMessage("You have logged out.");
  }

  function handleLogin(accessToken: string) {
    sessionStorage.setItem("devflow_token", accessToken);
    setToken(accessToken);
    setPage("dashboard");
    setMessage("Welcome to your DevFlow workspace!");
  }

  // Load the authenticated user's profile.
  useEffect(() => {
    if (!token || page !== "dashboard") return;

    let cancelled = false;

    async function loadUser() {
      try {
        const response = await fetch(`${API}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          if (!cancelled) handleLogout();
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load user profile.");
        }

        if (!cancelled) setUser(data);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load user profile."
          );
        }
      }
    }

    void loadUser();

    return () => {
      cancelled = true;
    };
  }, [token, page]);

  // Load projects belonging to the logged-in user.
  useEffect(() => {
    if (!token || page !== "dashboard") return;

    let cancelled = false;

    async function loadProjects() {
      setLoadingProjects(true);

      try {
        const response = await fetch(`${API}/projects/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          if (!cancelled) handleLogout();
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || "Could not load projects.");
        }

        if (!cancelled) setProjects(data);
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load projects."
          );
        }
      } finally {
        if (!cancelled) setLoadingProjects(false);
      }
    }

    void loadProjects();

    return () => {
      cancelled = true;
    };
  }, [token, page]);

  // Search project names without case sensitivity.
  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  async function addProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!projectName.trim()) {
      setMessage("Please enter a project name.");
      return;
    }

    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    try {
      const response = await fetch(`${API}/projects/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: projectName.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Could not create project.");
      }

      setProjects((previous) => [...previous, data]);
      setProjectName("");
      setDescription("");
      setMessage("Project created successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not create project."
      );
    }
  }

  function startEditing(project: Project) {
    setEditingProjectId(project.id);
    setEditProjectName(project.name);
    setEditDescription(project.description ?? "");
  }

  async function updateProject(projectId: number) {
    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    if (!editProjectName.trim()) {
      setMessage("Project name cannot be empty.");
      return;
    }

    try {
      const response = await fetch(`${API}/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editProjectName.trim(),
          description: editDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(data.detail || "Could not update project.");
      }

      setProjects((previous) =>
        previous.map((project) =>
          project.id === projectId ? data : project
        )
      );
      setEditingProjectId(null);
      setMessage("Project updated successfully!");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not update project."
      );
    }
  }

  async function deleteProject(projectId: number) {
    if (!token) {
      setMessage("Please log in again.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this project?")) {
      return;
    }

    try {
      const response = await fetch(`${API}/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (!response.ok) {
        let detail = "Could not delete project.";
        try {
          const data = await response.json();
          detail = data.detail || detail;
        } catch {
          // The server may return an empty or non-JSON error response.
        }
        throw new Error(detail);
      }

      setProjects((previous) =>
        previous.filter((project) => project.id !== projectId)
      );

      if (editingProjectId === projectId) {
        setEditingProjectId(null);
      }

      setMessage("Project deleted successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Could not delete project."
      );
    }
  }

  if (!token || page !== "dashboard") {
    if (page === "register") {
      return (
        <Register
          onRegistered={() => setPage("login")}
          onShowLogin={() => setPage("login")}
        />
      );
    }

    return (
      <Login
        onLogin={handleLogin}
        onShowRegister={() => setPage("register")}
      />
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="brand">DevFlow<span>.</span></h1>
        <p className="sidebar-label">WORKSPACE</p>

        <button
          className={`nav-item ${activeSection === "dashboard" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setActiveSection("dashboard");
            document.getElementById("dashboard-section")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          ▦ Dashboard
        </button>

        <button
          className={`nav-item ${activeSection === "projects" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setActiveSection("projects");
            document.getElementById("projects-section")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          ◇ My Projects
        </button>

        <button
          className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
          type="button"
          onClick={() => {
            setActiveSection("profile");
            document.getElementById("profile-section")?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          }}
        >
          ◉ My Profile
        </button>

        <div className="sidebar-footer">
          <div className="avatar">
            {user?.username?.charAt(0).toUpperCase() ?? "D"}
          </div>
          <div className="profile-info">
            <strong>{user?.username ?? "Loading profile..."}</strong>
            <p>{user?.email ?? "My workspace"}</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>Workspace / Dashboard</span>
          <div className="topbar-actions">
            <span className="status-dot">● API workspace</span>
            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
              Log out
            </button>
          </div>
        </header>
        
<section className="profile-section" id="profile-section">
  <div className="section-heading">
    <div>
      <h2>My Profile</h2>
      <p>Your DevFlow account information</p>
    </div>
  </div>

  <div className="profile-card">
    <div className="profile-avatar">
      {user?.username?.charAt(0).toUpperCase() ?? "U"}
    </div>

    <div className="profile-details">
      <h3>{user?.username ?? "Loading..."}</h3>
      <p>{user?.email ?? "Loading email..."}</p>
      <span className="profile-status">Account active</span>
    </div>
  </div>
</section>


        <section className="welcome" id="dashboard-section">
          <div>
            <p className="eyebrow">YOUR DEVELOPMENT SPACE</p>
            <h2>Build something great.</h2>
            <p className="subtitle">
              Organize your projects and keep your development moving.
            </p>
          </div>
          <div className="welcome-icon">{"</>"}</div>
        </section>

        <section className="stats-grid">
          <article className="stat-card">
            <p>Total Projects</p>
            <h3>{projects.length}</h3>
            <span>Saved in your workspace</span>
          </article>
          <article className="stat-card">
            <p>Workspace</p>
            <h3>Personal</h3>
            <span>Your development space</span>
          </article>
          <article className="stat-card">
            <p>Backend</p>
            <h3>Connected</h3>
            <span>FastAPI and PostgreSQL</span>
          </article>
        </section>

        <section className="project-layout" id="projects-section">
          <div className="panel projects-panel">
            <div className="panel-heading">
              <div>
                <h3>My Projects</h3>
                <p>Search and manage your development work.</p>
              </div>
              <span className="count">{filteredProjects.length}</span>
            </div>

            <div className="project-search">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search projects by name..."
                aria-label="Search projects by name"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearchTerm("")}
                >
                  Clear
                </button>
              )}
            </div>

            {loadingProjects ? (
              <div className="empty-state">
                <h4>Loading projects...</h4>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">＋</div>
                <h4>
                  {projects.length === 0
                    ? "No projects yet"
                    : "No matching projects"}
                </h4>
                <p>
                  {projects.length === 0
                    ? "Create a project using the form."
                    : "Try a different search term or clear the search."}
                </p>
                {searchTerm && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={() => setSearchTerm("")}
                  >
                    Show all projects
                  </button>
                )}
              </div>
            ) : (
              <div className="project-list">
                {filteredProjects.map((project) => (
                  <article className="project-item" key={project.id}>
                    {editingProjectId === project.id ? (
                      <div className="project-edit-form">
                        <label htmlFor={`edit-name-${project.id}`}>
                          Project name
                        </label>
                        <input
                          id={`edit-name-${project.id}`}
                          value={editProjectName}
                          onChange={(event) =>
                            setEditProjectName(event.target.value)
                          }
                        />

                        <label htmlFor={`edit-description-${project.id}`}>
                          Description
                        </label>
                        <textarea
                          id={`edit-description-${project.id}`}
                          value={editDescription}
                          onChange={(event) =>
                            setEditDescription(event.target.value)
                          }
                          rows={3}
                        />

                        <div className="project-actions">
                          <button
                            type="button"
                            className="primary-button"
                            onClick={() => void updateProject(project.id)}
                          >
                            Save Changes
                          </button>
                          <button
                            type="button"
                            className="logout-button"
                            onClick={() => setEditingProjectId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="project-icon">{"</>"}</div>
                        <div className="project-details">
                          <h4>{project.name}</h4>
                          <p>
                            {project.description || "No description provided."}
                          </p>
                          <div className="project-actions">
                            <button
                              type="button"
                              className="logout-button"
                              onClick={() => startEditing(project)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="delete-button"
                              onClick={() => void deleteProject(project.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="panel form-panel">
            <h3>Create a Project</h3>
            <p className="form-description">
              Start organizing your next idea.
            </p>

            <form onSubmit={addProject}>
              <label htmlFor="projectName">Project name</label>
              <input
                id="projectName"
                value={projectName}
                onChange={(event) => setProjectName(event.target.value)}
                placeholder="e.g. DevFlow"
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What are you building?"
                rows={4}
              />

              <button className="primary-button" type="submit">
                + Add Project
              </button>
            </form>

            <p className="message" role="status">{message}</p>
          </div>
        </section>

        <footer className="footer">
          DevFlow · Your personal development workspace
        </footer>
      </main>
    </div>
  );
}

export default App;
