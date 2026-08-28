/* ==========================================================================
   Quality Ironworks Material Request Portal - Logic Controller
   ========================================================================== */

// 1. Projects Database (68 parsed folders from the user's images)
const projectsDatabase = [
    { number: "10000", name: "QIW Internal Projects" },
    { number: "43004", name: "Katy Trail" },
    { number: "43007", name: "Addison Heights" },
    { number: "43013", name: "OHT Stemmons" },
    { number: "43015", name: "Eviva @ Trinity Mills" },
    { number: "44003", name: "Loyd Park Phase II" },
    { number: "44005", name: "HS RB3.3" },
    { number: "44007", name: "Castle Hills PH2" },
    { number: "44008", name: "Castle Hills PH1" },
    { number: "44011", name: "The Juniper" },
    { number: "44013", name: "Jefferson Ederville" },
    { number: "44014", name: "Park Lane (current)" },
    { number: "44014-HOLD", name: "Park Lane (Hold)" },
    { number: "44016", name: "Hartwood Square" },
    { number: "44017", name: "The Ambassador" },
    { number: "44018", name: "Northwest Village" },
    { number: "44022", name: "Cypress Creek" },
    { number: "44024", name: "UT Whitis" },
    { number: "44027", name: "Las Colinas" },
    { number: "44028", name: "Dallas Uptown" },
    { number: "44029", name: "Cabana" },
    { number: "44031", name: "Palladium Carver" },
    { number: "44032", name: "Walsh Heights" },
    { number: "45001", name: "Riverfront PH 2" },
    { number: "45002", name: "Custer 121 IN" },
    { number: "45004", name: "Culpepper" },
    { number: "45005", name: "Custer 121 MF" },
    { number: "45006", name: "Custer 121 TH" },
    { number: "45007", name: "The Caroline" },
    { number: "45008", name: "Ash 1" },
    { number: "45009", name: "Ash 2" },
    { number: "45010", name: "HS Expansion" },
    { number: "45011", name: "Thousand Oaks" },
    { number: "45012", name: "Viridian III" },
    { number: "45014", name: "Project X - West" },
    { number: "45016", name: "Trailhead" },
    { number: "45017", name: "Endeavor TCU" },
    { number: "45018", name: "Rosewood Southstone" },
    { number: "45019", name: "Lakewood CC" },
    { number: "45022", name: "Gordon Highlander" },
    { number: "45023", name: "The Grove (Frisco)" },
    { number: "45025", name: "Shiloh Place" },
    { number: "45026", name: "Kirbybrook TH" },
    { number: "45028", name: "Viridain IV TH" },
    { number: "45029", name: "DFW Hyatt House" },
    { number: "45031", name: "Fields West Block D" },
    { number: "45032", name: "Fields West Block E" },
    { number: "45033", name: "Fields West Block H" },
    { number: "45034", name: "Highland Springs RB3.4" },
    { number: "45035", name: "UTSW FW" },
    { number: "45036", name: "Palladium Buckner Station" },
    { number: "45037", name: "930 Military Parkway" },
    { number: "45038", name: "SW Parkway" },
    { number: "45039", name: "Riverfront Ph 1" },
    { number: "45040", name: "Aurora @ Firefly Park" },
    { number: "45043", name: "OHT Rowlett" },
    { number: "45044", name: "Project X - East ULU" },
    { number: "45045", name: "Fields West Block J" },
    { number: "45046", name: "2220 S. Ervay St" },
    { number: "45047", name: "Frisco Fresh (Freemont Fresh)" },
    { number: "45049", name: "805 Elm 711 Elm Projects" },
    { number: "45050", name: "Inwood Senior Living" },
    { number: "45051", name: "Arlington Stephens" },
    { number: "45054", name: "Morgan Hill - Canopies" },
    { number: "46000", name: "Polk Street Residences" },
    { number: "46001", name: "Jefferson Eden Village" },
    { number: "46002", name: "Restland Funeral Home" },
    { number: "46005", name: "Westdale Deep Ellum" },
    { number: "Custom", name: "Custom Project..." }
];

// 2. Line Items State
let lineItems = [];

// Touch & Mobile Device detection (handles iOS spoofing as macOS on iPad)
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                 (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

// 3. Document Ready Setup
document.addEventListener("DOMContentLoaded", () => {
    initializeFormDefaults();
    buildJobDropdown();
    setupEventListeners();
    initializeFinishToggles();
    initializeDraftingCanvas();
    updateLivePreview();
    
    // Warn if opened directly as file:// instead of localhost:8080
    if (window.location.protocol === 'file:') {
        const warningBanner = document.getElementById("privateNetworkWarning");
        if (warningBanner) {
            warningBanner.classList.remove("hidden");
        }
    }
});

// Get default material grade based on QIW standard layout
function getDefaultGrade(shape) {
    if (!shape) return "A36";
    const s = shape.toUpperCase().trim();
    if (s === "W" || s === "WT") {
        return "A992";
    } else if (s === "HSS" || s === "HSSR") {
        return "A500";
    } else if (s === "PIPE") {
        return "A53";
    } else if (s === "C" || s === "MC" || s === "L" || s === "PL" || s === "SQBR" || s === "GR") {
        return "A36";
    } else if (s === "MDG") {
        return "A653";
    } else if (s === "WWM") {
        return "A1064";
    } else if (s === "BY" || s === "QIW") {
        return "Material";
    } else {
        return "A36"; // Fallback default
    }
}

// Manage Product Finish / Item Builder Finish state
function initializeFinishToggles() {
    const applyFinishCheckbox = document.getElementById("applyFinishToAll");
    const topFinishSelect = document.getElementById("productFinish");
    const customProductFinishGroup = document.getElementById("customProductFinishGroup");
    const customProductFinishInput = document.getElementById("customProductFinish");
    
    const itemFinishSelect = document.getElementById("itemFinish");
    const customItemFinishInput = document.getElementById("customItemFinish");

    function syncFinishState() {
        if (applyFinishCheckbox.checked) {
            itemFinishSelect.value = topFinishSelect.value;
            customItemFinishInput.value = customProductFinishInput.value;
            
            if (topFinishSelect.value === "Custom") {
                customItemFinishInput.classList.remove("hidden");
            } else {
                customItemFinishInput.classList.add("hidden");
            }
            
            itemFinishSelect.disabled = true;
            customItemFinishInput.disabled = true;
        } else {
            itemFinishSelect.disabled = false;
            customItemFinishInput.disabled = false;
        }
    }

    topFinishSelect.addEventListener("change", (e) => {
        if (e.target.value === "Custom") {
            customProductFinishGroup.classList.remove("hidden");
            customProductFinishGroup.classList.add("open");
            customProductFinishInput.required = true;
            customProductFinishInput.focus();
        } else {
            customProductFinishGroup.classList.remove("open");
            setTimeout(() => {
                if (!customProductFinishGroup.classList.contains("open")) customProductFinishGroup.classList.add("hidden");
            }, 350);
            customProductFinishInput.required = false;
            customProductFinishInput.value = "";
        }
        if (applyFinishCheckbox.checked) {
            syncFinishState();
        }
        updateLivePreview();
    });

    customProductFinishInput.addEventListener("input", () => {
        if (applyFinishCheckbox.checked) {
            syncFinishState();
        }
        updateLivePreview();
    });

    itemFinishSelect.addEventListener("change", (e) => {
        if (e.target.value === "Custom") {
            customItemFinishInput.classList.remove("hidden");
            customItemFinishInput.focus();
        } else {
            customItemFinishInput.classList.add("hidden");
            customItemFinishInput.value = "";
        }
    });

    applyFinishCheckbox.addEventListener("change", syncFinishState);

    syncFinishState();
}

// Drawing Canvas Drafting Area Logic
let isDrawing = false;
let currentTool = 'pencil'; // 'pencil' or 'eraser'

function initializeDraftingCanvas() {
    const canvas = document.getElementById('draftingCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Configure initial line settings
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 2;

    function getCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);
        return { x, y };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getCoords(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        if (e.cancelable) e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getCoords(e);
        
        if (currentTool === 'eraser') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 16;
        } else {
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
        }
        
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (e.cancelable) e.preventDefault();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);

    const btnPencil = document.getElementById('toolPencil');
    const btnEraser = document.getElementById('toolEraser');
    const btnClear = document.getElementById('toolClear');

    if (btnPencil && btnEraser && btnClear) {
        btnPencil.addEventListener('click', () => {
            currentTool = 'pencil';
            btnPencil.classList.add('btn-primary');
            btnPencil.classList.remove('btn-secondary');
            btnEraser.classList.add('btn-secondary');
            btnEraser.classList.remove('btn-primary');
        });

        btnEraser.addEventListener('click', () => {
            currentTool = 'eraser';
            btnEraser.classList.add('btn-primary');
            btnEraser.classList.remove('btn-secondary');
            btnPencil.classList.add('btn-secondary');
            btnPencil.classList.remove('btn-primary');
        });

        btnClear.addEventListener('click', () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        });
    }
}

// Dynamically restrict Delivery/Ship Date to be at least 48 hours after Request Date
function updateMinDeliveryDate() {
    const reqDateVal = document.getElementById("requestDate").value;
    const delDateInput = document.getElementById("deliveryDate");
    if (!reqDateVal) return;
    
    const reqDate = new Date(reqDateVal + 'T00:00:00'); // ensure local timezone parsing
    const minDate = new Date(reqDate.getTime() + 48 * 60 * 60 * 1000); // add 48 hours (2 days)
    
    const yyyy = minDate.getFullYear();
    const mm = String(minDate.getMonth() + 1).padStart(2, '0');
    const dd = String(minDate.getDate()).padStart(2, '0');
    const minDateStr = `${yyyy}-${mm}-${dd}`;
    
    delDateInput.min = minDateStr;
    
    // If the current delivery date is before the new minimum, adjust it to the minimum
    if (delDateInput.value && delDateInput.value < minDateStr) {
        delDateInput.value = minDateStr;
        updateLivePreview();
    }
}

// Initialize date inputs and other form fields
function initializeFormDefaults() {
    // Set Request Date default to today (local system timezone)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yyyy}-${mm}-${dd}`;
    
    document.getElementById("requestDate").value = formattedToday;
    updateMinDeliveryDate();
    
    // Refresh table preview with empty default rows
    renderPreviewTable();
}

// Build the Job Selection dropdown from our database
function buildJobDropdown() {
    const jobSelect = document.getElementById("jobNumber");
    
    // Sort projects by number (except Custom at the end)
    const sortedProjects = [...projectsDatabase].sort((a, b) => {
        if (a.number === 'Custom') return 1;
        if (b.number === 'Custom') return -1;
        return a.number.localeCompare(b.number);
    });

    sortedProjects.forEach(proj => {
        const opt = document.createElement("option");
        opt.value = proj.number;
        opt.textContent = `${proj.number} - ${proj.name}`;
        jobSelect.appendChild(opt);
    });
}

// Setup Event Listeners across the SPA
function setupEventListeners() {
    const form = document.getElementById("materialRequestForm");
    const jobSelect = document.getElementById("jobNumber");
    const categorySelect = document.getElementById("categoryName");
    
    // Listen for changes on standard inputs to sync live preview
    const inputsToSync = [
        "requestDate", "deliveryDate", "subcategoryName", 
        "productFinish", "reason", "customJobNumber", "customJobName", "customCategoryName"
    ];
    
    inputsToSync.forEach(id => {
        document.getElementById(id).addEventListener("input", updateLivePreview);
    });

    document.getElementById("requestDate").addEventListener("input", updateMinDeliveryDate);

    // Job Selection Change Handler
    jobSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        const customJobGroup = document.getElementById("customJobGroup");
        const jobNameInput = document.getElementById("jobName");
        const customJobNum = document.getElementById("customJobNumber");
        const customJobName = document.getElementById("customJobName");
        
        if (val === "Custom") {
            // Reveal custom fields
            customJobGroup.classList.remove("hidden");
            customJobGroup.classList.add("open");
            customJobNum.required = true;
            customJobName.required = true;
            jobNameInput.value = "Custom";
        } else {
            // Hide and clear custom fields
            customJobGroup.classList.remove("open");
            setTimeout(() => {
                if (!customJobGroup.classList.contains("open")) customJobGroup.classList.add("hidden");
            }, 350);
            customJobNum.required = false;
            customJobName.required = false;
            customJobNum.value = "";
            customJobName.value = "";
            
            // Map name automatically
            const matchingJob = projectsDatabase.find(j => j.number === val);
            jobNameInput.value = matchingJob ? matchingJob.name : "";
        }
        updateLivePreview();
    });

    // Category Change Handler
    categorySelect.addEventListener("change", (e) => {
        const val = e.target.value;
        const customCategoryGroup = document.getElementById("customCategoryGroup");
        const customCatName = document.getElementById("customCategoryName");
        
        if (val === "Custom") {
            customCategoryGroup.classList.remove("hidden");
            customCategoryGroup.classList.add("open");
            customCatName.required = true;
        } else {
            customCategoryGroup.classList.remove("open");
            setTimeout(() => {
                if (!customCategoryGroup.classList.contains("open")) customCategoryGroup.classList.add("hidden");
            }, 350);
            customCatName.required = false;
            customCatName.value = "";
        }
        updateLivePreview();
    });

    // Location Radio group change
    document.getElementsByName("location").forEach(rad => {
        rad.addEventListener("change", updateLivePreview);
    });

    // Value matrix radio cards change
    document.getElementsByName("valueConfig").forEach(rad => {
        rad.addEventListener("change", updateLivePreview);
    });

    // Dynamic Items Builder: Add Item trigger
    document.getElementById("addItemBtn").addEventListener("click", () => {
        addItemFromBuilder();
    });

    // Trigger forms validation on enter inside builder fields
    const builderInputs = ["itemPcs", "itemDesc", "itemFeet", "itemInches", "itemFraction", "itemFinish"];
    builderInputs.forEach(id => {
        document.getElementById(id).addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                addItemFromBuilder();
            }
        });
    });

    // Document Action triggers
    document.getElementById("downloadPdfBtn").addEventListener("click", () => {
        if (validateForm()) {
            downloadMaterialRequestPDF();
        }
    });

    document.getElementById("emailBtn").addEventListener("click", () => {
        if (validateForm()) {
            openEmailWorkflow();
        }
    });

    // Theme Toggle Trigger
    document.getElementById("themeToggle").addEventListener("click", () => {
        const body = document.body;
        const icon = document.querySelector("#themeToggle i");
        body.classList.toggle("light-theme");
        
        if (body.classList.contains("light-theme")) {
            icon.className = "ph-bold ph-sun";
        } else {
            icon.className = "ph-bold ph-moon";
        }
    });

    // User Guide Modal controls
    const guideModal = document.getElementById("userGuideModal");
    const userGuideBtn = document.getElementById("userGuideBtn");
    if (userGuideBtn) {
        userGuideBtn.addEventListener("click", () => {
            guideModal.classList.remove("hidden");
        });
    }
    document.getElementById("userGuideBannerBtn").addEventListener("click", () => {
        guideModal.classList.remove("hidden");
    });
    document.getElementById("closeUserGuideModal").addEventListener("click", () => {
        guideModal.classList.add("hidden");
    });
    guideModal.addEventListener("click", (e) => {
        if (e.target === guideModal) {
            guideModal.classList.add("hidden");
        }
    });

    // User Guide Tabs trigger
    const tabBtns = document.querySelectorAll(".modal-tabs .tab-btn");
    tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            tabBtns.forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(tc => tc.classList.remove("active"));
            
            btn.classList.add("active");
            document.getElementById(btn.dataset.tab).classList.add("active");
        });
    });

    // (Guide downloads handled directly via HTML anchors for offline compatibility)

    // Standard Document sizing Fit previews
    document.getElementById("btnPreviewCallouts").addEventListener("click", () => {
        alert("The guide is rendered natively in HTML with high fidelity. You can scroll through the interactive view below.");
    });
    document.getElementById("btnPreviewParts").addEventListener("click", () => {
        alert("The guide is rendered natively in HTML with high fidelity. You can scroll through the interactive view below.");
    });

    // Email workflow modal controls
    const emailModal = document.getElementById("emailPromptModal");
    document.getElementById("cancelEmailPrompt").addEventListener("click", () => {
        emailModal.classList.add("hidden");
    });
    document.getElementById("btnEmailDirect").addEventListener("click", () => {
        emailModal.classList.add("hidden");
        triggerEmailLaunch();
    });
    document.getElementById("btnEmailWithPreview").addEventListener("click", () => {
        emailModal.classList.add("hidden");
        // Scroll right side Live Preview into view for they to review
        document.querySelector(".panel-preview").scrollIntoView({ behavior: "smooth" });
        // Flash a subtle border border highlight
        const sheet = document.getElementById("requestDocument");
        sheet.style.boxShadow = "0 0 20px #ff7b00";
        setTimeout(() => {
            sheet.style.boxShadow = "";
        }, 1500);
        
        // Setup a temporary floater button to trigger dispatch after reviewing
        setTimeout(() => {
            if (confirm("Sheet previewed! Ready to dispatch email?")) {
                triggerEmailLaunch();
            }
        }, 800);
    });

    // Close Email Instructions Helper modal
    const emailHelperModal = document.getElementById("emailHelperModal");
    document.getElementById("closeEmailHelperBtn").addEventListener("click", () => {
        emailHelperModal.classList.add("hidden");
    });
    emailHelperModal.addEventListener("click", (e) => {
        if (e.target === emailHelperModal) {
            emailHelperModal.classList.add("hidden");
        }
    });

    // Enforce Shape-Specific Input Constraints on Dimension box
    const shapeSelect = document.getElementById("itemShape");
    const descInput = document.getElementById("itemDesc");

    const placeholders = {
        "W": "Depth x Weight (e.g. 12x16)",
        "WT": "Depth x Weight (e.g. 4x9)",
        "HSS": "H x W x Thk (e.g. 6x4x1/4 or 1 1/2x1 1/2x14GA)",
        "HSSR": "Dia x Thk (e.g. 5x.5 or 1.5x11GA)",
        "C": "Depth x Weight (e.g. 6x13)",
        "MC": "Depth x Weight (e.g. 10x8.4)",
        "L": "Leg1 x Leg2 x Thk (e.g. 3x3x1/4)",
        "PL": "Thk x Width (e.g. 3/4x10 or 0.75x10)",
        "SQBR": "Size (e.g. 1/2 or 0.75)",
        "GR": "H x Thk x WIDTH (e.g. 1 1/2x3/16xWIDTH)",
        "MDG": "Pitch - Gauge x WIDTH (e.g. 1.0Cx20GAxWIDTH)",
        "WWM": "Spc x Spc * Ga * WIDTH (e.g. 2x2*.135*WIDTH)",
        "XF": "Pitch - Gauge x WIDTH (e.g. 1/2x#16xWIDTH)",
        "CP": "Thk x Width (e.g. 1/2x10)",
        "KP": "Kick Plate code (e.g. QKP1)",
        "BY": "Type anything...",
        "QIW": "Type anything..."
    };

    const shapeRegexes = {
        "PL": /[^0-9x\/.]/gi,
        "CP": /[^0-9x\/.]/gi,
        "W": /[^0-9x.]/gi,
        "WT": /[^0-9x.]/gi,
        "C": /[^0-9x.]/gi,
        "MC": /[^0-9x.]/gi,
        "L": /[^0-9x\/.]/gi,
        "HSS": /[^0-9x\/. gGvVaA\-]/gi,
        "HSSR": /[^0-9x\/. gGvVaA\-]/gi,
        "SQBR": /[^0-9\/.]/gi,
        "GR": /[^0-9x\/. wWiIdDtThH\-]/gi,
        "MDG": /[^0-9x\/. wWiIdDtThH\-]/gi,
        "WWM": /[^0-9x\/. wWiIdDtThH\*\- ]/gi,
        "XF": /[^0-9x\/. wWiIdDtThH\-]/gi,
        "KP": /[^0-9a-zA-Z]/gi
    };

    shapeSelect.addEventListener("change", () => {
        const shape = shapeSelect.value;
        descInput.placeholder = placeholders[shape] || "e.g. 8x10...";
        if (shapeRegexes[shape]) {
            descInput.value = descInput.value.replace(shapeRegexes[shape], "");
        }
    });

    descInput.addEventListener("input", () => {
        const shape = shapeSelect.value;
        if (shapeRegexes[shape]) {
            const start = descInput.selectionStart;
            const end = descInput.selectionEnd;
            const originalVal = descInput.value;
            const cleanedVal = originalVal.replace(shapeRegexes[shape], "");
            
            if (originalVal !== cleanedVal) {
                descInput.value = cleanedVal;
                const diff = originalVal.length - cleanedVal.length;
                descInput.setSelectionRange(start - diff, end - diff);
            }
        }
    });
}

// Check and validate required fields in the form
function validateForm() {
    const form = document.getElementById("materialRequestForm");
    
    // Check elements HTML5 validity
    if (!form.checkValidity()) {
        form.reportValidity();
        return false;
    }
    
    // Extra validation: Delivery Date must be at least 48 hours after Request Date
    const reqDateVal = document.getElementById("requestDate").value;
    const delDateVal = document.getElementById("deliveryDate").value;
    if (reqDateVal && delDateVal) {
        const reqDate = new Date(reqDateVal + 'T00:00:00');
        const delDate = new Date(delDateVal + 'T00:00:00');
        const diffTime = delDate.getTime() - reqDate.getTime();
        const diffHours = diffTime / (60 * 60 * 1000);
        if (diffHours < 48) {
            alert("Ship date can only be the minimum of 48 hrs from the request date if you need prior to that confirm in the shop.");
            document.getElementById("deliveryDate").focus();
            return false;
        }
    }
    
    // Extra validation: Needs at least 1 line item
    if (lineItems.length === 0) {
        alert("Please add at least one item to your Material Request using the line item builder.");
        document.getElementById("itemDesc").focus();
        return false;
    }
    
    return true;
}

// Add Item from Form Builder into local list array
function addItemFromBuilder() {
    const pcsInput = document.getElementById("itemPcs");
    const shapeSelect = document.getElementById("itemShape");
    const descInput = document.getElementById("itemDesc");
    const feetInput = document.getElementById("itemFeet");
    const inchesInput = document.getElementById("itemInches");
    const fractionSelect = document.getElementById("itemFraction");
    const finishInput = document.getElementById("itemFinish");
    const applyFinishCheckbox = document.getElementById("applyFinishToAll");
    const topFinishInput = document.getElementById("productFinish");
    
    const pcs = parseInt(pcsInput.value);
    const shape = shapeSelect.value;
    const desc = descInput.value.trim();
    const feet = parseInt(feetInput.value) || 0;
    const inches = parseInt(inchesInput.value) || 0;
    const fraction = fractionSelect.value;
    
    // Validate builder inputs
    if (!pcs || pcs < 1) {
        alert("Please enter a valid number of pieces (1 or more).");
        pcsInput.focus();
        return;
    }
    if (!shape) {
        alert("Please select a shape from the dropdown list.");
        shapeSelect.focus();
        return;
    }
    if (!desc) {
        alert("Please enter the dimension or description.");
        descInput.focus();
        return;
    }
    if (feet < 0 || inches < 0 || inches > 11) {
        alert("Please enter a valid length (inches must be between 0 and 11).");
        inchesInput.focus();
        return;
    }
    
    // Validate finish
    let finishVal = "";
    if (applyFinishCheckbox.checked) {
        let topVal = topFinishInput.value;
        if (topVal === "Custom") {
            topVal = document.getElementById("customProductFinish").value.trim();
        }
        finishVal = topVal;
    } else {
        let selectedVal = finishInput.value;
        if (selectedVal === "Custom") {
            selectedVal = document.getElementById("customItemFinish").value.trim();
        }
        finishVal = selectedVal;
    }
    
    if (!finishVal) {
        alert("Please enter or select a finish.");
        if (applyFinishCheckbox.checked) {
            if (topFinishInput.value === "Custom") {
                document.getElementById("customProductFinish").focus();
            } else {
                topFinishInput.focus();
            }
        } else {
            if (finishInput.value === "Custom") {
                document.getElementById("customItemFinish").focus();
            } else {
                finishInput.focus();
            }
        }
        return;
    }
    
    // Get default steel grade mapping
    const gradeVal = getDefaultGrade(shape);
    
    // Format description text for PDF drawing & preview
    let formattedDesc = "";
    if (shape === "QIW") {
        const cleanDim = desc.replace(/^QIW-?\s*/i, "").trim();
        formattedDesc = `QIW-${cleanDim}`;
    } else if (shape === "BY") {
        const cleanDim = desc.replace(/^BY\s+/i, "").trim();
        formattedDesc = `BY ${cleanDim}`;
    } else {
        const cleanDim = desc.trim();
        // If the dimension starts with the shape prefix (e.g. "W8x10" or "W 8x10"), don't duplicate the shape prefix
        const regex = new RegExp("^" + shape + "\\b", "i");
        const regexNoSpace = new RegExp("^" + shape + "\\d", "i");
        if (regex.test(cleanDim) || regexNoSpace.test(cleanDim)) {
            formattedDesc = cleanDim;
        } else {
            formattedDesc = `${shape} ${cleanDim}`;
        }
    }
    
    // Push to state array
    lineItems.push({
        pcs: pcs,
        shape: shape,
        dimension: desc,
        desc: formattedDesc,
        feet: feet,
        inches: inches,
        fraction: fraction,
        finish: finishVal,
        grade: gradeVal
    });
    
    // Clear builder fields
    pcsInput.value = "";
    shapeSelect.value = "";
    descInput.value = "";
    feetInput.value = "";
    inchesInput.value = "";
    fractionSelect.value = "";
    if (!applyFinishCheckbox.checked) {
        finishInput.value = "";
        document.getElementById("customItemFinish").value = "";
        document.getElementById("customItemFinish").classList.add("hidden");
    }
    
    // Re-render UI list & sheet table
    renderItemsList();
    renderPreviewTable();
    updateItemCountBadge();
    
    // Focus pcs input for rapid consecutive adding
    pcsInput.focus();
}

// Delete item row from local state
function deleteLineItem(index) {
    lineItems.splice(index, 1);
    renderItemsList();
    renderPreviewTable();
    updateItemCountBadge();
}

// Update the numerical item badge in form
function updateItemCountBadge() {
    const badge = document.getElementById("itemCountBadge");
    badge.textContent = `${lineItems.length} Item${lineItems.length !== 1 ? 's' : ''}`;
}

// Render the items list on the form panel
function renderItemsList() {
    const listContainer = document.getElementById("addedItemsList");
    listContainer.innerHTML = "";
    
    if (lineItems.length === 0) {
        listContainer.innerHTML = `<li class="empty-list-msg">No items added yet. Formulate items using the builder above.</li>`;
        return;
    }
    
    lineItems.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "item-list-row";
        
        // Formatted length label
        let lenText = '';
        if (item.feet > 0 || item.inches > 0 || item.fraction) {
            if (item.feet > 0) {
                lenText += `${item.feet}'`;
            }
            if (item.inches > 0 || item.fraction) {
                if (item.feet > 0) lenText += '-';
                lenText += `${item.inches}`;
                if (item.fraction) {
                    lenText += ` ${item.fraction}`;
                }
                lenText += '"';
            }
        } else {
            lenText = 'N/A';
        }
            
        li.innerHTML = `
            <span class="item-number">${index + 1}</span>
            <span class="item-qty-lbl">${item.pcs} pcs</span>
            <span class="item-desc-txt">${item.desc}</span>
            <span class="item-len-lbl"><i class="ph ph-ruler"></i> ${lenText}</span>
            <button type="button" class="item-delete-btn" title="Remove item" onclick="deleteLineItem(${index})">
                <i class="ph-bold ph-trash"></i>
            </button>
        `;
        listContainer.appendChild(li);
    });
}

// Render the Items table inside the Live PDF sheet
function renderPreviewTable() {
    const tbody = document.getElementById("previewTableBody");
    tbody.innerHTML = "";
    
    // Render our added items
    lineItems.forEach((item, index) => {
        const tr = document.createElement("tr");
        const ftVal = item.feet > 0 ? item.feet : '-';
        let inVal = '-';
        if (item.inches > 0 || item.fraction) {
            inVal = item.inches > 0 ? item.inches.toString() : '';
            if (item.fraction) {
                inVal += (inVal ? ' ' : '') + item.fraction;
            }
        }
        
        tr.innerHTML = `
            <td>${item.pcs}</td>
            <td class="col-desc-bottom">${item.desc}</td>
            <td>${ftVal}</td>
            <td>${inVal}</td>
            <td>${item.grade || '-'}</td>
            <td>${item.finish || '-'}</td>
            <td></td>
        `;
        tbody.appendChild(tr);
    });
    
    // Pad the table with empty yellow rows up to exactly 8 rows matching the image
    const minRows = 8;
    if (lineItems.length < minRows) {
        const padCount = minRows - lineItems.length;
        for (let i = 0; i < padCount; i++) {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
                <td></td>
            `;
            tbody.appendChild(tr);
        }
    }
}

// Formats YYYY-MM-DD input date to standard MM/DD/YYYY print date
function formatPrintDate(dateStr) {
    if (!dateStr) return "-- / -- / ----";
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

// Sync Form variables to PDF sheet Live preview
function updateLivePreview() {
    // 1. Map Dates
    const reqDate = document.getElementById("requestDate").value;
    const delDate = document.getElementById("deliveryDate").value;
    document.getElementById("previewReqDate").textContent = formatPrintDate(reqDate);
    document.getElementById("previewDelDate").textContent = formatPrintDate(delDate);
    
    // 2. Map Job details
    const jobNumSelect = document.getElementById("jobNumber").value;
    let jobNumFinal = "-----";
    let jobNameFinal = "Select a project...";
    
    if (jobNumSelect === "Custom") {
        jobNumFinal = document.getElementById("customJobNumber").value.trim() || "Custom";
        jobNameFinal = document.getElementById("customJobName").value.trim() || "Custom Name";
    } else if (jobNumSelect) {
        jobNumFinal = jobNumSelect;
        const matchingJob = projectsDatabase.find(j => j.number === jobNumSelect);
        jobNameFinal = matchingJob ? matchingJob.name : "-----";
    }
    
    document.getElementById("previewJobNum").textContent = jobNumFinal;
    document.getElementById("previewJobName").textContent = jobNameFinal;
    
    // 3. Map Categories
    const categorySelect = document.getElementById("categoryName").value;
    let categoryFinal = "-----";
    if (categorySelect === "Custom") {
        categoryFinal = document.getElementById("customCategoryName").value.trim() || "Custom Category";
    } else if (categorySelect) {
        categoryFinal = categorySelect;
    }
    document.getElementById("previewCategory").textContent = categoryFinal;
    
    // 4. Map Subcategory & Finish
    const subcat = document.getElementById("subcategoryName").value.trim();
    const finishSelect = document.getElementById("productFinish").value;
    let finish = finishSelect;
    if (finishSelect === "Custom") {
        finish = document.getElementById("customProductFinish").value.trim();
    }
    document.getElementById("previewSubcategory").textContent = subcat || "-----";
    document.getElementById("previewFinish").textContent = finish || "-----";
    
    // 5. Map Location checkboxes
    const locActive = document.querySelector('input[name="location"]:checked').value;
    if (locActive === "Pick up parts room") {
        document.getElementById("previewPickupChecked").textContent = "✓";
        document.getElementById("previewDeliveryChecked").textContent = "";
    } else {
        document.getElementById("previewPickupChecked").textContent = "";
        document.getElementById("previewDeliveryChecked").textContent = "✓";
    }
    
    // 6. Map Reason text
    const reason = document.getElementById("reason").value.trim();
    document.getElementById("previewReason").textContent = reason || "-----";
    
    // 7. Value configuration Matrix
    const activeValue = document.querySelector('input[name="valueConfig"]:checked');
    const valText = activeValue ? activeValue.value : "$1";
    
    // Reset preview slots
    document.getElementById("fillContract").textContent = "";
    document.getElementById("fillCO").textContent = "";
    document.getElementById("fillNoValue").textContent = "";
    
    // Apply logic based on select value
    if (valText === "$2" || valText === "$3") {
        document.getElementById("fillCO").textContent = valText;
    } else if (valText === "$1") {
        document.getElementById("fillNoValue").textContent = "✓";
    } else if (valText === "Scope item") {
        document.getElementById("fillContract").textContent = "Scope Item";
    }
}

// PDF Export Execution (html2pdf.js integration with absolute DOM cloning to fix scroll crops and left boundaries)
// Helper to generate PDF Blob
function generatePDFBlob() {
    const original = document.getElementById("requestDocument");
    
    // Create a temporary absolute container at the body level (avoid negative left positions to prevent cropping!)
    const tempContainer = document.createElement("div");
    tempContainer.style.position = "absolute";
    tempContainer.style.left = "0";
    tempContainer.style.top = "0";
    tempContainer.style.width = "794px";
    tempContainer.style.height = "1024px";
    tempContainer.style.zIndex = "-9999"; // Render behind the active UI surface
    tempContainer.style.overflow = "visible";
    tempContainer.style.background = "#ffffff";
    tempContainer.style.margin = "0";
    tempContainer.style.padding = "0";
    tempContainer.style.border = "none";
    
    // Clone the sheet element
    const clone = original.cloneNode(true);
    clone.style.transform = "none";
    clone.style.margin = "0";
    clone.style.position = "relative";
    clone.style.boxShadow = "none";
    
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);

    // Copy drawing canvas content to the cloned canvas element
    const originalCanvas = document.getElementById("draftingCanvas");
    const clonedCanvas = clone.querySelector("#draftingCanvas");
    if (originalCanvas && clonedCanvas) {
        const destCtx = clonedCanvas.getContext('2d');
        destCtx.drawImage(originalCanvas, 0, 0);
    }
    
    const pdfFilename = getPDFFilename();
    
    const opt = {
        margin:       0,
        filename:     pdfFilename,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { 
            scale: 2.0, 
            useCORS: true, 
            letterRendering: true,
            logging: false,
            scrollY: 0,
            scrollX: 0,
            x: 0,
            y: 0,
            windowWidth: 794,
            windowHeight: 1024
        },
        jsPDF:        { unit: 'px', format: [794, 1024], orientation: 'portrait' }
    };
    
    // Render and return Blob promise
    return html2pdf().from(clone).set(opt).output('blob')
        .then(pdfBlob => {
            document.body.removeChild(tempContainer);
            return pdfBlob;
        })
        .catch(err => {
            console.error("PDF generation failure: ", err);
            if (document.body.contains(tempContainer)) {
                document.body.removeChild(tempContainer);
            }
            throw err;
        });
}

// Helper for triggering file downloads on mobile and desktop (bypasses blob block on file:// mobile Safari/Chrome)
function triggerDownload(blob, filename) {
    if (isMobile) {
        const file = new File([blob], filename, { type: blob.type });
        // Attempt Web Share API first if supported
        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
                files: [file],
                title: filename,
                text: `Material Request Portal download: ${filename}`
            }).catch(shareErr => {
                console.warn("Mobile Share failed, falling back to data URL preview: ", shareErr);
                fallbackMobileDownload(blob, filename);
            });
            return;
        } else {
            fallbackMobileDownload(blob, filename);
            return;
        }
    }
    
    // Standard Desktop download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
        URL.revokeObjectURL(link.href);
    }, 1500);
}

// Fallback method for mobile when Web Share is blocked or running offline on file:// protocol
function fallbackMobileDownload(blob, filename) {
    const reader = new FileReader();
    reader.onloadend = () => {
        const dataUrl = reader.result;
        if (blob.type === 'application/pdf') {
            // PDF: Open in new tab using iframe to bypass mobile browser block
            const newTab = window.open();
            if (newTab) {
                newTab.document.write(`<iframe src="${dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                newTab.document.title = filename;
            } else {
                window.location.href = dataUrl;
            }
        } else {
            // Excel/Binary: Trigger direct base64 data URL link click
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };
    reader.readAsDataURL(blob);
}

// PDF Export Execution
function downloadMaterialRequestPDF() {
    const pdfFilename = getPDFFilename();
    const excelFilename = getExcelFilename();
    
    if (isMobile) {
        return generatePDFBlob()
            .then(pdfBlob => {
                const wb = generateFBOMWorkbook();
                if (!wb) throw new Error("No items added yet to compile Excel.");
                const excelBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
                const excelBlob = new Blob([excelBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                
                const pdfFile = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
                const excelFile = new File([excelBlob], excelFilename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                
                // If Web Share is supported on mobile, share both files at once!
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile, excelFile] })) {
                    return navigator.share({
                        files: [pdfFile, excelFile],
                        title: `${pdfFilename} & ${excelFilename}`,
                        text: "Save your Manual Shop Drawing PDF and FBOM Excel sheet."
                    });
                } else {
                    // Fallback to separate mobile previews/downloads
                    fallbackMobileDownload(pdfBlob, pdfFilename);
                    setTimeout(() => {
                        fallbackMobileDownload(excelBlob, excelFilename);
                    }, 400);
                }
            })
            .catch(err => {
                console.error("Mobile sequential download/share failure: ", err);
            });
    }
    
    // Desktop: Trigger both PDF and Excel downloads synchronously in the user gesture loop
    return generatePDFBlob()
        .then(pdfBlob => {
            triggerDownload(pdfBlob, pdfFilename);
            downloadFBOMExcel();
            console.log("Material Request PDF & FBOM Excel downloaded successfully!");
        })
        .catch(err => {
            console.error("PDF/Excel download failure: ", err);
            alert("Encountered error generating files.");
        });
}

// Helper to convert blob to base64
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64String = reader.result.split(',')[1];
            resolve(base64String);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// Helper to manage loading state during email preparation
function toggleLoadingState(isLoading) {
    const emailBtn = document.getElementById("emailBtn");
    const downloadPdfBtn = document.getElementById("downloadPdfBtn");
    if (!emailBtn || !downloadPdfBtn) return;
    
    if (isLoading) {
        emailBtn.disabled = true;
        downloadPdfBtn.disabled = true;
        emailBtn.innerHTML = `<i class="ph-bold ph-spinner-gap spin"></i> Preparing Email...`;
    } else {
        emailBtn.disabled = false;
        downloadPdfBtn.disabled = false;
        emailBtn.innerHTML = `<i class="ph-bold ph-envelope-simple"></i> Email Request`;
    }
}

// Open Prompt Overlay for Outlook dispatch
function openEmailWorkflow() {
    const emailModal = document.getElementById("emailPromptModal");
    emailModal.classList.remove("hidden");
}

// Trigger direct Outlook integration with mailto fallback
function triggerEmailLaunch() {
    // Show loading state
    toggleLoadingState(true);
    
    // Pull active parameters
    const jobNumSelect = document.getElementById("jobNumber").value;
    let jobNumFinal = "JOB";
    if (jobNumSelect === "Custom") {
        jobNumFinal = document.getElementById("customJobNumber").value.trim() || "CUSTOM";
    } else if (jobNumSelect) {
        jobNumFinal = jobNumSelect;
    }
    
    let jobNameFinal = "Custom Job";
    if (jobNumSelect === "Custom") {
        jobNameFinal = document.getElementById("customJobName").value.trim() || "Custom Job";
    } else if (jobNumSelect) {
        const matchingJob = projectsDatabase.find(j => j.number === jobNumSelect);
        jobNameFinal = matchingJob ? matchingJob.name : "-----";
    }
    
    const categorySelect = document.getElementById("categoryName").value;
    const categoryFinal = categorySelect === "Custom" ? (document.getElementById("customCategoryName").value.trim() || "Custom Category") : categorySelect;
    const subcategoryFinal = document.getElementById("subcategoryName").value.trim();
    const emailSubject = `${jobNumFinal} - ${jobNameFinal} - ${categoryFinal} - ${subcategoryFinal}`;
    
    const reqDate = document.getElementById("requestDate").value;
    const delDate = document.getElementById("deliveryDate").value;
    const category = document.getElementById("categoryName").value;
    const subcategory = document.getElementById("subcategoryName").value;
    const finishSelect = document.getElementById("productFinish").value;
    let finish = finishSelect;
    if (finishSelect === "Custom") {
        finish = document.getElementById("customProductFinish").value.trim();
    }
    const location = document.querySelector('input[name="location"]:checked').value;
    
    // Compile clean plain-text body summary
    let bodyText = `A manual material request has been generated for Job #${jobNumFinal} (${jobNameFinal}).\n\n`;
    bodyText += `SUMMARY:\n`;
    bodyText += `------------------------------------------\n`;
    bodyText += `* Request Date: ${formatPrintDate(reqDate)}\n`;
    bodyText += `* Required Delivery/Ship Date: ${formatPrintDate(delDate)}\n`;
    bodyText += `* Job Details: #${jobNumFinal} - ${jobNameFinal}\n`;
    bodyText += `* Category: ${category === "Custom" ? document.getElementById("customCategoryName").value : category}\n`;
    bodyText += `* Subcategory: ${subcategory}\n`;
    bodyText += `* Product Finish: ${finish}\n`;
    bodyText += `* Destination: ${location}\n`;
    bodyText += `------------------------------------------\n\n`;
    bodyText += `Total Line Items: ${lineItems.length} items.\n\n`;
    bodyText += `Please see attached PDF and FBOM files.\n\n`;
    bodyText += `Requested by: Field Engineering Representative\n`;
    bodyText += `Quality Ironworks Field Portal System`;

    // 1. Generate PDF blob and convert to Base64
    generatePDFBlob()
        .then(pdfBlob => {
            return blobToBase64(pdfBlob);
        })
        .then(pdfBase64 => {
            // 2. Generate Excel base64
            const wb = generateFBOMWorkbook();
            if (!wb) {
                throw new Error("No line items to generate FBOM Excel.");
            }
            const excelBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
            
            // 3. Prepare payload
            const payload = {
                pdfBase64: pdfBase64,
                excelBase64: excelBase64,
                pdfFilename: getPDFFilename(),
                excelFilename: getExcelFilename(),
                cc: "Manual@qiworks.com",
                subject: emailSubject,
                body: bodyText
            };
            
            // 4. Determine endpoint
            const apiEndpoint = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? '/api/email' : 'http://localhost:8080/api/email';
            
            return fetch(apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        })
        .then(res => {
            if (!res.ok) {
                throw new Error("Local server response was not ok");
            }
            return res.json();
        })
        .then(data => {
            toggleLoadingState(false);
            if (data && data.success) {
                alert("Success! Outlook email compose window has been opened with both the PDF and FBOM files attached.");
            } else {
                throw new Error(data.error || "Unknown server error");
            }
        })
        .catch(err => {
            console.warn("Direct Outlook local server attachment failed. Deciding fallback...", err);
            
            const pdfFilename = getPDFFilename();
            const excelFilename = getExcelFilename();
            
            return generatePDFBlob()
                .then(pdfBlob => {
                    const wb = generateFBOMWorkbook();
                    if (!wb) throw new Error("No items");
                    const excelBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
                    const excelBlob = new Blob([excelBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    
                    const pdfFile = new File([pdfBlob], pdfFilename, { type: 'application/pdf' });
                    const excelFile = new File([excelBlob], excelFilename, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                    
                    // On mobile, attempt direct sharing first (bypassing canShare which can return false false-positives on mobile Chrome)
                    if (isMobile && navigator.share) {
                        toggleLoadingState(false);
                        console.log("Mobile device detected. Attempting direct Web Share...");
                        
                        // Temporarily override document title to force mobile email apps to use it as the subject
                        const originalTitle = document.title;
                        document.title = emailSubject;
                        
                        return navigator.share({
                            files: [pdfFile, excelFile],
                            title: emailSubject,
                            text: bodyText
                        }).then(() => {
                            // Restore original title
                            document.title = originalTitle;
                        }).catch(shareErr => {
                            if (shareErr.name === 'AbortError' || shareErr.message === "Share canceled") {
                                console.log("User cancelled sharing.");
                                document.title = originalTitle;
                                throw new Error("User cancelled sharing");
                            }
                            
                            // If sharing both files fails, try sharing only the PDF (highly compatible) and download Excel in background
                            console.warn("Sharing both files failed. Attempting PDF-only share...", shareErr);
                            triggerDownload(excelBlob, excelFilename, true);
                            
                            return navigator.share({
                                files: [pdfFile],
                                title: emailSubject,
                                text: bodyText
                            }).then(() => {
                                document.title = originalTitle;
                            }).catch(share2Err => {
                                document.title = originalTitle;
                                throw share2Err;
                            });
                        }).catch(pdfShareErr => {
                            document.title = originalTitle;
                            if (pdfShareErr.message === "User cancelled sharing" || pdfShareErr.name === 'AbortError' || pdfShareErr.message === "Share canceled") {
                                console.log("User cancelled PDF share.");
                                throw new Error("User cancelled sharing");
                            }
                            
                            // If sharing completely fails on mobile Chrome/Safari, download both files natively
                            console.warn("Web Share completely failed on mobile. Downloading files directly...", pdfShareErr);
                            fallbackMobileDownload(pdfBlob, pdfFilename);
                            setTimeout(() => {
                                fallbackMobileDownload(excelBlob, excelFilename);
                            }, 400);
                            alert("Your browser does not support direct attachments. The Material Request PDF and FBOM Excel have been downloaded to your device.");
                        });
                    }
                    // On desktop, use standard canShare check if available
                    else if (navigator.canShare && navigator.canShare({ files: [pdfFile, excelFile] })) {
                        toggleLoadingState(false);
                        return navigator.share({
                            files: [pdfFile, excelFile],
                            title: emailSubject,
                            text: bodyText
                        }).catch(shareErr => {
                            if (shareErr.name === 'AbortError') {
                                throw new Error("User cancelled sharing");
                            } else {
                                throw shareErr;
                            }
                        });
                    } else {
                        // Desktop fallback: Trigger EML download
                        throw new Error("Web Share not supported");
                    }
                })
                .catch(fallbackErr => {
                    // Avoid triggering EML if user just aborted the share action
                    if (fallbackErr.message === "User cancelled sharing") {
                        return;
                    }
                    
                    console.log("Web Share unavailable or failed. Triggering client-side EML compilation: ", fallbackErr);
                    
                    const emlFilename = `Double_Click_to_Email_Job_${jobNumFinal}.eml`;
                    
                    return generatePDFBlob()
                        .then(pdfBlob => {
                            return blobToBase64(pdfBlob);
                        })
                        .then(pdfBase64 => {
                            const wb = generateFBOMWorkbook();
                            if (!wb) throw new Error("No items");
                            const excelBase64 = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
                            
                            // Generate unique boundary
                            const boundary = "NextPart_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
                            
                            // Wrap base64 contents to 76 characters for MIME compliance
                            const wrapFunc = (str) => {
                                if (!str) return "";
                                const lines = [];
                                for (let i = 0; i < str.length; i += 76) {
                                    lines.push(str.substring(i, i + 76));
                                }
                                return lines.join("\r\n");
                            };
                            
                            const pdfBase64Wrapped = wrapFunc(pdfBase64);
                            const excelBase64Wrapped = wrapFunc(excelBase64);
                            
                            const ccList = "Manual@qiworks.com";
                            const subjectText = emailSubject;
                            
                            // Construct EML MIME structure
                            const emlParts = [];
                            emlParts.push("X-Unsent: 1");
                            emlParts.push(`Cc: ${ccList}`);
                            emlParts.push(`Subject: ${subjectText}`);
                            emlParts.push("MIME-Version: 1.0");
                            emlParts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
                            emlParts.push("");
                            emlParts.push(`--${boundary}`);
                            emlParts.push("Content-Type: text/plain; charset=\"utf-8\"");
                            emlParts.push("Content-Transfer-Encoding: 7bit");
                            emlParts.push("");
                            emlParts.push(bodyText);
                            emlParts.push("");
                            emlParts.push(`--${boundary}`);
                            emlParts.push(`Content-Type: application/pdf; name="${pdfFilename}"`);
                            emlParts.push("Content-Transfer-Encoding: base64");
                            emlParts.push(`Content-Disposition: attachment; filename="${pdfFilename}"`);
                            emlParts.push("");
                            emlParts.push(pdfBase64Wrapped);
                            emlParts.push("");
                            emlParts.push(`--${boundary}`);
                            emlParts.push(`Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet; name="${excelFilename}"`);
                            emlParts.push("Content-Transfer-Encoding: base64");
                            emlParts.push(`Content-Disposition: attachment; filename="${excelFilename}"`);
                            emlParts.push("");
                            emlParts.push(excelBase64Wrapped);
                            emlParts.push("");
                            emlParts.push(`--${boundary}--`);
                            
                            const emlContent = emlParts.join("\r\n");
                            const emlBlob = new Blob([emlContent], { type: "message/rfc822" });
                            
                            // Trigger download of EML file
                            const link = document.createElement('a');
                            link.href = URL.createObjectURL(emlBlob);
                            link.download = emlFilename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(link.href);
                            
                            toggleLoadingState(false);
                            
                            // Show email helper modal with instructions
                            const emailHelperModal = document.getElementById("emailHelperModal");
                            if (emailHelperModal) {
                                const modalTitle = emailHelperModal.querySelector("h2");
                                if (modalTitle) {
                                    modalTitle.textContent = "Email Draft Generated!";
                                }
                                const modalDesc = emailHelperModal.querySelector("p");
                                if (modalDesc) {
                                    modalDesc.textContent = "Your Outlook draft with attached PDF and Excel is ready to open.";
                                }
                                
                                const helperStepsContainer = emailHelperModal.querySelector(".helper-steps");
                                if (helperStepsContainer) {
                                    helperStepsContainer.innerHTML = `
                                        <div style="margin-bottom: 10px; display: flex; gap: 8px; align-items: start;">
                                            <span style="background: var(--accent-orange); color: white; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; flex-shrink: 0; margin-top: 2px;">1</span>
                                            <span>We have generated a pre-attached email draft: <br>
                                            <strong style="font-family: monospace; color: var(--accent-orange); word-break: break-all;">${emlFilename}</strong></span>
                                        </div>
                                        <div style="margin-bottom: 10px; display: flex; gap: 8px; align-items: start;">
                                            <span style="background: var(--accent-orange); color: white; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; flex-shrink: 0; margin-top: 2px;">2</span>
                                            <span><strong>Double-click</strong> or open the downloaded file from your browser's downloads bar.</span>
                                        </div>
                                        <div style="display: flex; gap: 8px; align-items: start;">
                                            <span style="background: var(--accent-orange); color: white; border-radius: 50%; width: 18px; height: 18px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: bold; flex-shrink: 0; margin-top: 2px;">3</span>
                                            <span>It will open directly in Outlook with the PDF and Excel sheets **already attached**, CC filled, and body pre-written. Just hit **Send**!</span>
                                        </div>
                                    `;
                                }
                                emailHelperModal.classList.remove("hidden");
                            }
                        })
                        .catch(err2 => {
                            console.error("EML generation failure: ", err2);
                            toggleLoadingState(false);
                            alert("Failed to generate the email draft automatically. Please use the Download PDF / Excel buttons and draft the email manually.");
                        });
                });
        });
}

// Parse dynamic steel descriptions into Shape and Dimensions (size)
function parseSteelDescription(desc) {
    const d = desc.trim();
    
    // Check for "BY" shape first explicitly: when they put BY, they can put whatever text they want.
    // In FBOM, the shape should be "BY" and description (Dimensions column) should be whatever they type (the full text).
    const byRegex = /^(BY)(?:\b|\s|$)/i;
    if (byRegex.test(d)) {
        return {
            shape: "BY",
            dimensions: d // Exactly whatever they type
        };
    }
    
    // Pre-defined shapes list sorted by length (descending) to avoid partial matches
    const shapes = ["FLAT BAR", "FLATBAR", "BAR", "PIPE", "HSS", "MC", "TS", "WT", "HP", "PL", "W", "L", "C"];
    
    for (const shape of shapes) {
        // Match shape at the beginning, case-insensitive, followed by space, number, or end of string
        const regex = new RegExp("^(" + shape + ")(?:\\b|[\\s\\d\\-X\\*]|$)", "i");
        const match = d.match(regex);
        if (match) {
            const shapePart = match[1].toUpperCase();
            const dimPart = d.substring(match[0].length).trim();
            return {
                shape: shapePart,
                dimensions: dimPart || d
            };
        }
    }
    
    // Fallback: entire string as dimensions
    return {
        shape: "",
        dimensions: d
    };
}

// Helper to get professional PDF filename
function getPDFFilename() {
    const jobNumSelect = document.getElementById("jobNumber").value;
    let jobNumFinal = "JOB";
    if (jobNumSelect === "Custom") {
        jobNumFinal = document.getElementById("customJobNumber").value.trim() || "CUSTOM";
    } else if (jobNumSelect) {
        jobNumFinal = jobNumSelect;
    }
    const cleanNum = jobNumFinal.replace(/[^a-zA-Z0-9]/g, "_");
    const dateStamp = new Date().toISOString().slice(0,10);
    return `QIW_Material_Request_${cleanNum}_${dateStamp}.pdf`;
}

// Helper to get professional FBOM Excel filename
function getExcelFilename() {
    const jobNumSelect = document.getElementById("jobNumber").value;
    let jobNumFinal = "JOB";
    if (jobNumSelect === "Custom") {
        jobNumFinal = document.getElementById("customJobNumber").value.trim() || "CUSTOM";
    } else if (jobNumSelect) {
        jobNumFinal = jobNumSelect;
    }
    const cleanNum = jobNumFinal.replace(/[^a-zA-Z0-9]/g, "_");
    const dateStamp = new Date().toISOString().slice(0,10);
    return `QIW_FBOM_${cleanNum}_${dateStamp}.xlsx`;
}

// Generate SheetJS workbook matching the exact QIW FBOM structure
function generateFBOMWorkbook() {
    if (lineItems.length === 0) {
        return null;
    }
    
    // Create new empty workbook
    const wb = XLSX.utils.book_new();
    
    // Define column headers matching the QIW FBOM schema
    const headers = [
        "Approval Status", "Drawing #", "Main Mark", "Piece Mark", 
        "Quantity", "Shape", "Dimensions", "Length", 
        "Grade", "Finish", "Remark", "Category", 
        "Sub-Category", "Sequence", "Lot #", "Sequence Qty"
    ];
    
    // Map portal's line items array to Excel schema rows
    const dataRows = lineItems.map(item => {
        let fbomShape = item.shape || "";
        let fbomDim = item.dimension || item.desc || "";
        
        if (fbomShape === "BY") {
            fbomShape = "BY";
            // For BY: shape should be BY and description/dimension should be exactly whatever they typed
        } else if (fbomShape === "QIW") {
            fbomShape = "BY";
            // Map shape to 'BY' and keep description exactly as entered (no QIW- prefix)
            fbomDim = fbomDim.trim();
        } else if (fbomShape) {
            // Standard shapes: clean leading shape prefix from dimension to keep FBOM clean (e.g. if they typed "W8x10" under shape "W", write "8x10")
            const prefixRegex = new RegExp("^" + fbomShape + "\\s*-?\\s*", "i");
            fbomDim = fbomDim.replace(prefixRegex, "").trim();
        } else {
            // Fallback parsing for legacy/safety
            const parsed = parseSteelDescription(item.desc);
            fbomShape = parsed.shape;
            fbomDim = parsed.dimensions;
        }
        
        // Format length string (e.g. 10'-6 1/2" or empty)
        let lengthText = "";
        if (item.feet > 0 || item.inches > 0 || item.fraction) {
            if (item.feet > 0) {
                lengthText += `${item.feet}'`;
            }
            if (item.inches > 0 || item.fraction) {
                if (item.feet > 0) lengthText += '-';
                lengthText += `${item.inches}`;
                if (item.fraction) {
                    lengthText += ` ${item.fraction}`;
                }
                lengthText += '"';
            }
        }
            
        // Get dynamic category
        const categorySelect = document.getElementById("categoryName").value;
        let categoryFinal = categorySelect;
        if (categorySelect === "Custom") {
            categoryFinal = document.getElementById("customCategoryName").value.trim();
        }
        
        // Get dynamic subcategory
        const subcategoryFinal = document.getElementById("subcategoryName").value.trim();
        
        // Return 16-field mapping matching headers exactly
        return {
            "Approval Status": "",
            "Drawing #": "",
            "Main Mark": "",
            "Piece Mark": "",
            "Quantity": item.pcs,
            "Shape": fbomShape,
            "Dimensions": fbomDim,
            "Length": lengthText,
            "Grade": item.grade || "A36",
            "Finish": item.finish,
            "Remark": "",
            "Category": categoryFinal,
            "Sub-Category": subcategoryFinal,
            "Sequence": "",
            "Lot #": "",
            "Sequence Qty": ""
        };
    });
    
    // Convert JSON records to a native Worksheet
    const ws = XLSX.utils.json_to_sheet(dataRows, { header: headers });
    
    // Append Worksheet named 'FBOM' to Workbook
    XLSX.utils.book_append_sheet(wb, ws, "FBOM");
    return wb;
}

// Generate SheetJS workbook matching the exact QIW FBOM structure and trigger download
function downloadFBOMExcel() {
    const wb = generateFBOMWorkbook();
    if (!wb) {
        alert("Cannot generate FBOM because no line items are added yet.");
        return;
    }
    const excelFilename = getExcelFilename();
    
    // Generate array buffer from SheetJS and wrap in a Blob with correct Excel MIME type
    const excelBytes = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const excelBlob = new Blob([excelBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Always trigger download using our robust, mobile-compatible triggerDownload function
    triggerDownload(excelBlob, excelFilename);
    
    console.log("FBOM Excel package compiled and downloaded successfully!");
}
