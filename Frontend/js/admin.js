function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { "Authorization": "Bearer " + token } : {};
}
const API_BASE_URL =
    window.location.hostname === "localhost"
        ? "http://localhost:5000"
        : "https://college-notes-website-f64v.onrender.com";

const API = `${API_BASE_URL}/api/subjects`;


// ==========================================
// TAB SWITCHING
// ==========================================

const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach(function (btn) {

    btn.addEventListener("click", function () {

        tabButtons.forEach(b => b.classList.remove("active"));
        tabPanels.forEach(p => p.classList.remove("active"));

        btn.classList.add("active");
        document
            .getElementById("tab-" + btn.dataset.tab)
            .classList.add("active");

    });

});


// ==========================================
// HELPER: SHOW STATUS MESSAGE
// ==========================================

function showStatus(elementId, message, isError) {

    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = "status-message " + (isError ? "error" : "success");

    setTimeout(function () {
        el.textContent = "";
        el.className = "status-message";
    }, 3000);

}


// ==========================================
// HELPER: POPULATE A <select>
// ==========================================

function populateSelect(selectEl, items, valueKey, labelFn, placeholder) {

    selectEl.innerHTML = "";

    if (placeholder) {
        const opt = document.createElement("option");
        opt.value = "";
        opt.textContent = placeholder;
        selectEl.appendChild(opt);
    }

    items.forEach(function (item) {
        const opt = document.createElement("option");
        opt.value = item[valueKey];
        opt.textContent = labelFn(item);
        selectEl.appendChild(opt);
    });

}


// ==========================================================
// ==========================================================
// SUBJECTS
// ==========================================================
// ==========================================================

const subjectForm = document.getElementById("subjectForm");
const subjectsTableBody = document.getElementById("subjectsTableBody");

let allSubjects = [];


async function loadSubjectsAdmin() {

    try {

        const res = await fetch(API);
        const data = await res.json();

        if (!data.success) {
            subjectsTableBody.innerHTML = "<tr><td colspan='5'>Unable to load subjects.</td></tr>";
            return;
        }

        allSubjects = data.subjects;

        renderSubjectsTable();
        populateSelect(
            document.getElementById("unitSubjectSelect"),
            allSubjects,
            "id",
            s => `${s.subject_name} (${s.subject_code})`,
            "-- Select Subject --"
        );
        populateSelect(
            document.getElementById("unitsFilterSelect"),
            allSubjects,
            "id",
            s => `${s.subject_name} (${s.subject_code})`,
            "-- Select Subject --"
        );

    } catch (error) {

        console.error(error);
        subjectsTableBody.innerHTML = "<tr><td colspan='5'>Unable to connect to server.</td></tr>";

    }

}


function renderSubjectsTable() {

    subjectsTableBody.innerHTML = "";

    if (allSubjects.length === 0) {
        subjectsTableBody.innerHTML = "<tr><td colspan='5'>No subjects yet.</td></tr>";
        return;
    }

    allSubjects.forEach(function (subject) {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${subject.id}</td>
            <td>${subject.subject_name}</td>
            <td>${subject.subject_code}</td>
            <td>${subject.description || ""}</td>
            <td class="row-actions">
                <button class="edit-btn" onclick="editSubject(${subject.id})">Edit</button>
                <button class="delete-btn" onclick="deleteSubject(${subject.id})">Delete</button>
            </td>
        `;

        subjectsTableBody.appendChild(tr);

    });

}


subjectForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = document.getElementById("subjectId").value;

    const payload = {
        subject_name: document.getElementById("subjectName").value.trim(),
        subject_code: document.getElementById("subjectCode").value.trim(),
        description: document.getElementById("subjectDescription").value.trim()
    };

    try {

        const res = await fetch(
            id ? `${API}/${id}` : API,
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!data.success) {
            showStatus("subjectStatus", data.message || "Failed to save subject.", true);
            return;
        }

        showStatus("subjectStatus", id ? "Subject updated!" : "Subject created!", false);
        resetSubjectForm();
        loadSubjectsAdmin();

    } catch (error) {

        console.error(error);
        showStatus("subjectStatus", "Unable to connect to server.", true);

    }

});


function editSubject(id) {

    const subject = allSubjects.find(s => s.id === id);
    if (!subject) return;

    document.getElementById("subjectFormTitle").textContent = "Edit Subject";
    document.getElementById("subjectId").value = subject.id;
    document.getElementById("subjectName").value = subject.subject_name;
    document.getElementById("subjectCode").value = subject.subject_code;
    document.getElementById("subjectDescription").value = subject.description || "";

}


async function deleteSubject(id) {

    if (!confirm("Delete this subject? This will fail if it still has units.")) return;

    try {

        const res = await fetch(`${API}/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!data.success) {
            showStatus("subjectStatus", data.message || "Failed to delete subject.", true);
            return;
        }

        showStatus("subjectStatus", "Subject deleted.", false);
        loadSubjectsAdmin();

    } catch (error) {

        console.error(error);
        showStatus("subjectStatus", "Unable to connect to server.", true);

    }

}


function resetSubjectForm() {

    document.getElementById("subjectFormTitle").textContent = "Add Subject";
    document.getElementById("subjectId").value = "";
    subjectForm.reset();

}


document.getElementById("cancelSubjectEdit")
    .addEventListener("click", resetSubjectForm);


// ==========================================================
// ==========================================================
// UNITS
// ==========================================================
// ==========================================================

const unitForm = document.getElementById("unitForm");
const unitsTableBody = document.getElementById("unitsTableBody");
const unitsFilterSelect = document.getElementById("unitsFilterSelect");

let currentUnits = [];


unitsFilterSelect.addEventListener("change", function () {
    loadUnitsForSubject(unitsFilterSelect.value);
});


async function loadUnitsForSubject(subjectId) {

    if (!subjectId) {
        unitsTableBody.innerHTML = "<tr><td colspan='4'>Select a subject above</td></tr>";
        currentUnits = [];
        return;
    }

    try {

        const res = await fetch(`${API}/${subjectId}/units`);
        const data = await res.json();

        if (!data.success) {
            unitsTableBody.innerHTML = "<tr><td colspan='4'>Unable to load units.</td></tr>";
            return;
        }

        currentUnits = data.units;
        renderUnitsTable();

        // Also refresh the content-form's unit dropdown to match this subject
        populateSelect(
            document.getElementById("contentUnitSelect"),
            currentUnits,
            "id",
            u => `Unit ${u.unit_number}: ${u.unit_name}`,
            "-- Select Unit --"
        );
        populateSelect(
            document.getElementById("contentsFilterSelect"),
            currentUnits,
            "id",
            u => `Unit ${u.unit_number}: ${u.unit_name}`,
            "-- Select Unit --"
        );

    } catch (error) {

        console.error(error);
        unitsTableBody.innerHTML = "<tr><td colspan='4'>Unable to connect to server.</td></tr>";

    }

}


function renderUnitsTable() {

    unitsTableBody.innerHTML = "";

    if (currentUnits.length === 0) {
        unitsTableBody.innerHTML = "<tr><td colspan='4'>No units yet for this subject.</td></tr>";
        return;
    }

    currentUnits.forEach(function (unit) {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${unit.id}</td>
            <td>${unit.unit_number}</td>
            <td>${unit.unit_name}</td>
            <td class="row-actions">
                <button class="edit-btn" onclick="editUnit(${unit.id})">Edit</button>
                <button class="delete-btn" onclick="deleteUnit(${unit.id})">Delete</button>
            </td>
        `;

        unitsTableBody.appendChild(tr);

    });

}


unitForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = document.getElementById("unitId").value;
    const subject_id = document.getElementById("unitSubjectSelect").value;

    if (!subject_id) {
        showStatus("unitStatus", "Please select a subject.", true);
        return;
    }

    const payload = {
        subject_id: subject_id,
        unit_number: document.getElementById("unitNumber").value,
        unit_name: document.getElementById("unitName").value.trim()
    };

    try {

        const res = await fetch(
            id ? `${API}/units/${id}` : `${API}/units`,
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!data.success) {
            showStatus("unitStatus", data.message || "Failed to save unit.", true);
            return;
        }

        showStatus("unitStatus", id ? "Unit updated!" : "Unit created!", false);
        resetUnitForm();

        // Refresh table if the filter matches this subject
        if (unitsFilterSelect.value === String(subject_id)) {
            loadUnitsForSubject(subject_id);
        }

    } catch (error) {

        console.error(error);
        showStatus("unitStatus", "Unable to connect to server.", true);

    }

});


function editUnit(id) {

    const unit = currentUnits.find(u => u.id === id);
    if (!unit) return;

    document.getElementById("unitFormTitle").textContent = "Edit Unit";
    document.getElementById("unitId").value = unit.id;
    document.getElementById("unitSubjectSelect").value = unit.subject_id;
    document.getElementById("unitNumber").value = unit.unit_number;
    document.getElementById("unitName").value = unit.unit_name;

}


async function deleteUnit(id) {

    if (!confirm("Delete this unit? This will fail if it still has contents.")) return;

    try {

        const res = await fetch(`${API}/units/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!data.success) {
            showStatus("unitStatus", data.message || "Failed to delete unit.", true);
            return;
        }

        showStatus("unitStatus", "Unit deleted.", false);
        loadUnitsForSubject(unitsFilterSelect.value);

    } catch (error) {

        console.error(error);
        showStatus("unitStatus", "Unable to connect to server.", true);

    }

}


function resetUnitForm() {

    document.getElementById("unitFormTitle").textContent = "Add Unit";
    document.getElementById("unitId").value = "";
    unitForm.reset();

}


document.getElementById("cancelUnitEdit")
    .addEventListener("click", resetUnitForm);


// ==========================================================
// ==========================================================
// CONTENTS
// ==========================================================
// ==========================================================

const contentForm = document.getElementById("contentForm");
const contentsTableBody = document.getElementById("contentsTableBody");
const contentsFilterSelect = document.getElementById("contentsFilterSelect");

let currentContents = [];


contentsFilterSelect.addEventListener("change", function () {
    loadContentsForUnit(contentsFilterSelect.value);
});


async function loadContentsForUnit(unitId) {

    if (!unitId) {
        contentsTableBody.innerHTML = "<tr><td colspan='4'>Select a unit above</td></tr>";
        currentContents = [];
        return;
    }

    try {

        const res = await fetch(`${API}/unit/${unitId}/contents`);
        const data = await res.json();

        if (!data.success) {
            contentsTableBody.innerHTML = "<tr><td colspan='4'>Unable to load contents.</td></tr>";
            return;
        }

        currentContents = data.contents;
        renderContentsTable();

        populateSelect(
            document.getElementById("noteContentSelect"),
            currentContents,
            "id",
            c => `${c.content_number}. ${c.content_name}`,
            "-- Select Content --"
        );
        populateSelect(
            document.getElementById("notesFilterSelect"),
            currentContents,
            "id",
            c => `${c.content_number}. ${c.content_name}`,
            "-- Select Content --"
        );

    } catch (error) {

        console.error(error);
        contentsTableBody.innerHTML = "<tr><td colspan='4'>Unable to connect to server.</td></tr>";

    }

}


function renderContentsTable() {

    contentsTableBody.innerHTML = "";

    if (currentContents.length === 0) {
        contentsTableBody.innerHTML = "<tr><td colspan='4'>No contents yet for this unit.</td></tr>";
        return;
    }

    currentContents.forEach(function (content) {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${content.id}</td>
            <td>${content.content_number}</td>
            <td>${content.content_name}</td>
            <td class="row-actions">
                <button class="edit-btn" onclick="editContent(${content.id})">Edit</button>
                <button class="delete-btn" onclick="deleteContent(${content.id})">Delete</button>
            </td>
        `;

        contentsTableBody.appendChild(tr);

    });

}


contentForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = document.getElementById("contentId").value;
    const unit_id = document.getElementById("contentUnitSelect").value;

    if (!unit_id) {
        showStatus("contentStatus", "Please select a unit.", true);
        return;
    }

    const payload = {
        unit_id: unit_id,
        content_number: document.getElementById("contentNumber").value,
        content_name: document.getElementById("contentName").value.trim()
    };

    try {

        const res = await fetch(
            id ? `${API}/contents/${id}` : `${API}/contents`,
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!data.success) {
            showStatus("contentStatus", data.message || "Failed to save content.", true);
            return;
        }

        showStatus("contentStatus", id ? "Content updated!" : "Content created!", false);
        resetContentForm();

        if (contentsFilterSelect.value === String(unit_id)) {
            loadContentsForUnit(unit_id);
        }

    } catch (error) {

        console.error(error);
        showStatus("contentStatus", "Unable to connect to server.", true);

    }

});


function editContent(id) {

    const content = currentContents.find(c => c.id === id);
    if (!content) return;

    document.getElementById("contentFormTitle").textContent = "Edit Content";
    document.getElementById("contentId").value = content.id;
    document.getElementById("contentUnitSelect").value = content.unit_id;
    document.getElementById("contentNumber").value = content.content_number;
    document.getElementById("contentName").value = content.content_name;

}


async function deleteContent(id) {

    if (!confirm("Delete this content? This will fail if it still has notes.")) return;

    try {

        const res = await fetch(`${API}/contents/${id}`, { method: "DELETE" });
        const data = await res.json();

        if (!data.success) {
            showStatus("contentStatus", data.message || "Failed to delete content.", true);
            return;
        }

        showStatus("contentStatus", "Content deleted.", false);
        loadContentsForUnit(contentsFilterSelect.value);

    } catch (error) {

        console.error(error);
        showStatus("contentStatus", "Unable to connect to server.", true);

    }

}


function resetContentForm() {

    document.getElementById("contentFormTitle").textContent = "Add Content";
    document.getElementById("contentId").value = "";
    contentForm.reset();

}


document.getElementById("cancelContentEdit")
    .addEventListener("click", resetContentForm);


// ==========================================================
// ==========================================================
// NOTES
// ==========================================================
// ==========================================================

const noteForm = document.getElementById("noteForm");
const notesTableBody = document.getElementById("notesTableBody");
const notesFilterSelect = document.getElementById("notesFilterSelect");

let currentNotes = [];


notesFilterSelect.addEventListener("change", function () {
    loadNotesForContent(notesFilterSelect.value);
});


async function loadNotesForContent(contentId) {

    if (!contentId) {
        notesTableBody.innerHTML = "<tr><td colspan='5'>Select a content above</td></tr>";
        currentNotes = [];
        return;
    }

    try {

        const res = await fetch(`${API}/content/${contentId}/notes`);
        const data = await res.json();

        if (!data.success) {
            notesTableBody.innerHTML = "<tr><td colspan='5'>Unable to load notes.</td></tr>";
            return;
        }

        currentNotes = data.notes;
        renderNotesTable();

    } catch (error) {

        console.error(error);
        notesTableBody.innerHTML = "<tr><td colspan='5'>Unable to connect to server.</td></tr>";

    }

}


function renderNotesTable() {

    notesTableBody.innerHTML = "";

    if (currentNotes.length === 0) {
        notesTableBody.innerHTML = "<tr><td colspan='5'>No notes yet for this content.</td></tr>";
        return;
    }

    currentNotes.forEach(function (note) {

        const shortBody = (note.body || "").length > 80
            ? note.body.substring(0, 80) + "..."
            : (note.body || "");

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td><input type="checkbox" class="noteCheckbox" value="${note.id}"></td>
            <td>${note.id}</td>
            <td>${note.title}</td>
            <td>${shortBody}</td>
            <td class="row-actions">
                <button class="edit-btn" onclick="editNote(${note.id})">Edit</button>
                <button class="delete-btn" onclick="deleteNote(${note.id})">Delete</button>
            </td>
        `;

        notesTableBody.appendChild(tr);

    });

    // Reset "select all" whenever the table is redrawn
    const selectAllBox = document.getElementById("selectAllNotes");
    if (selectAllBox) {
        selectAllBox.checked = false;
    }

}


// ==========================================
// SELECT ALL CHECKBOX
// ==========================================

const selectAllNotesEl = document.getElementById("selectAllNotes");

if (selectAllNotesEl) {

    selectAllNotesEl.addEventListener("change", function () {

        const checked = this.checked;

        document
            .querySelectorAll(".noteCheckbox")
            .forEach(cb => cb.checked = checked);

    });

}


// ==========================================
// DELETE SELECTED NOTES
// ==========================================

const deleteSelectedBtn = document.getElementById("deleteSelectedNotesBtn");

if (deleteSelectedBtn) {

    deleteSelectedBtn.addEventListener("click", async function () {

        const selectedIds = Array.from(
            document.querySelectorAll(".noteCheckbox:checked")
        ).map(cb => cb.value);

        if (selectedIds.length === 0) {
            showStatus("noteStatus", "No notes selected.", true);
            return;
        }

        if (!confirm(`Delete ${selectedIds.length} selected note(s)?`)) return;

        try {

            // Delete each selected note one at a time
            for (const id of selectedIds) {

                const res = await fetch(`${API}/notes/${id}`, { method: "DELETE", headers: authHeaders() });
                const data = await res.json();

                if (!data.success) {
                    console.error(`Failed to delete note ${id}:`, data.message);
                }

            }

            showStatus("noteStatus", "Selected notes deleted.", false);
            loadNotesForContent(notesFilterSelect.value);

        } catch (error) {

            console.error(error);
            showStatus("noteStatus", "Unable to connect to server.", true);

        }

    });

}


const noteFileInput = document.getElementById("noteFileInput");


// ==========================================
// UPLOAD FILE (IF ONE WAS SELECTED)
// Returns the file_url string, or the
// existing hidden value if no new file chosen.
// ==========================================

async function uploadNoteFileIfNeeded() {

    const file = noteFileInput.files[0];
    const existingUrl = document.getElementById("noteFileUrl").value;

    // No new file selected -> keep whatever was already there (edit case)
    if (!file) {
        return existingUrl;
    }

    const formData = new FormData();
    formData.append("file", file);

    showStatus("uploadStatus", "Uploading file...", false);

    const res = await fetch(`${API}/notes/upload`, {
        method: "POST",
        headers: authHeaders(),
        body: formData
        // NOTE: do NOT set Content-Type manually for FormData —
        // the browser sets the correct multipart boundary automatically.
    });

    const data = await res.json();

    if (!data.success) {
        throw new Error(data.message || "File upload failed.");
    }

    showStatus("uploadStatus", "File uploaded!", false);

    return data.file_url;

}


noteForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const id = document.getElementById("noteId").value;
    const content_id = document.getElementById("noteContentSelect").value;

    if (!content_id) {
        showStatus("noteStatus", "Please select a content.", true);
        return;
    }

    try {

        // Step 1: upload the file first (if one was chosen)
        const fileUrl = await uploadNoteFileIfNeeded();

        // Step 2: save the note with the resulting file_url
        const payload = {
            content_id: content_id,
            title: document.getElementById("noteTitle").value.trim(),
            body: document.getElementById("noteBody").value.trim(),
            file_url: fileUrl
        };

        const res = await fetch(
            id ? `${API}/notes/${id}` : `${API}/notes`,
            {
                method: id ? "PUT" : "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify(payload)
            }
        );

        const data = await res.json();

        if (!data.success) {
            showStatus("noteStatus", data.message || "Failed to save note.", true);
            return;
        }

        showStatus("noteStatus", id ? "Note updated!" : "Note created!", false);
        resetNoteForm();

        if (notesFilterSelect.value === String(content_id)) {
            loadNotesForContent(content_id);
        }

    } catch (error) {

        console.error(error);
        showStatus("noteStatus", error.message || "Unable to connect to server.", true);

    }

});


function editNote(id) {

    const note = currentNotes.find(n => n.id === id);
    if (!note) return;

    document.getElementById("noteFormTitle").textContent = "Edit Note";
    document.getElementById("noteId").value = note.id;
    document.getElementById("noteContentSelect").value = note.content_id;
    document.getElementById("noteTitle").value = note.title;
    document.getElementById("noteBody").value = note.body || "";
    document.getElementById("noteFileUrl").value = note.file_url || "";

    noteFileInput.value = "";

    const label = document.getElementById("currentFileLabel");
    label.textContent = note.file_url
        ? `Current file: ${note.file_url} (choose a new file above to replace it)`
        : "";

}


async function deleteNote(id) {

    if (!confirm("Delete this note?")) return;

    try {

        const res = await fetch(`${API}/notes/${id}`, { method: "DELETE", headers: authHeaders() });
        const data = await res.json();

        if (!data.success) {
            showStatus("noteStatus", data.message || "Failed to delete note.", true);
            return;
        }

        showStatus("noteStatus", "Note deleted.", false);
        loadNotesForContent(notesFilterSelect.value);

    } catch (error) {

        console.error(error);
        showStatus("noteStatus", "Unable to connect to server.", true);

    }

}


function resetNoteForm() {

    document.getElementById("noteFormTitle").textContent = "Add Note";
    document.getElementById("noteId").value = "";
    document.getElementById("noteFileUrl").value = "";
    document.getElementById("currentFileLabel").textContent = "";
    noteForm.reset();

}


document.getElementById("cancelNoteEdit")
    .addEventListener("click", resetNoteForm);


// ==========================================================
// START
// ==========================================================

loadSubjectsAdmin();
// ==========================================================
// PYQ UPLOAD
// ==========================================================

const pyqForm = document.getElementById("pyqForm");
const pyqSubjectSelect = document.getElementById("pyqSubjectSelect");
const pyqUploadBtn = document.getElementById("pyqUploadBtn");


// Load subjects into PYQ dropdown
function loadPYQSubjects() {

    if (!pyqSubjectSelect) return;

    populateSelect(
        pyqSubjectSelect,
        allSubjects,
        "id",
        s => `${s.subject_name} (${s.subject_code})`,
        "-- Select Subject --"
    );

}


// Upload PYQ
if (pyqForm) {

    pyqForm.addEventListener("submit", async function (event) {

        event.preventDefault();

        const semesterId =
            document.getElementById("pyqSemesterId").value;

        const subjectId =
            document.getElementById("pyqSubjectSelect").value;

        const examYear =
            document.getElementById("pyqExamYear").value;

        const paperTitle =
            document.getElementById("pyqPaperTitle")
                .value
                .trim();

        const description =
            document.getElementById("pyqDescription")
                .value
                .trim();

        const file =
            document.getElementById("pyqFile")
                .files[0];


        // Validation
        if (!semesterId) {

            showStatus(
                "pyqStatus",
                "Please enter semester ID.",
                true
            );

            return;
        }

        if (!subjectId) {

            showStatus(
                "pyqStatus",
                "Please select a subject.",
                true
            );

            return;
        }

        if (!examYear) {

            showStatus(
                "pyqStatus",
                "Please enter exam year.",
                true
            );

            return;
        }

        if (!paperTitle) {

            showStatus(
                "pyqStatus",
                "Please enter paper title.",
                true
            );

            return;
        }

        if (!file) {

            showStatus(
                "pyqStatus",
                "Please select a PDF file.",
                true
            );

            return;
        }


        // PDF validation
        if (file.type !== "application/pdf") {

            showStatus(
                "pyqStatus",
                "Only PDF files are allowed.",
                true
            );

            return;
        }


        try {

            pyqUploadBtn.disabled = true;

            showStatus(
                "pyqStatus",
                "Uploading PYQ to Cloudinary...",
                false
            );


            const formData = new FormData();

            formData.append(
                "paperFile",
                file
            );

            formData.append(
                "semesterId",
                semesterId
            );

            formData.append(
                "subjectId",
                subjectId
            );

            formData.append(
                "examYear",
                examYear
            );

            formData.append(
                "paperTitle",
                paperTitle
            );

            formData.append(
                "description",
                description
            );


            const res = await fetch(
                `${API_BASE_URL}/api/pyq/upload`,
                {
                    method: "POST",

                    headers: authHeaders(),

                    body: formData
                }
            );


            const data = await res.json();


            if (!res.ok || !data.success) {

                throw new Error(
                    data.message ||
                    "PYQ upload failed."
                );

            }


            showStatus(
                "pyqStatus",
                "PYQ uploaded successfully!",
                false
            );


            // Reset form
            pyqForm.reset();


        } catch (error) {

            console.error(
                "PYQ Upload Error:",
                error
            );

            showStatus(
                "pyqStatus",
                error.message ||
                "Unable to upload PYQ.",
                true
            );

        } finally {

            pyqUploadBtn.disabled = false;

        }

    });

}