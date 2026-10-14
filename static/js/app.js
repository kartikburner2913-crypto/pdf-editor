/**
 * PDF Studio & Editor - Client Application
 * Enterprise-grade cloud & self-hosted PDF studio powered by FastAPI & PyMuPDF.
 */

// Application State
const state = {
  docId: null,
  filename: null,
  docInfo: null,
  currentPage: 1,
  totalPages: 1,
  zoom: 1.0,
  inspectMode: true,
  activeTab: "tab-edit",
  selectedBlock: null,
  textBlocks: [],
  annotations: [],
  pageWidthPt: 595,
  pageHeightPt: 842,
  formFields: [],
  selectedFormField: null,
  formPlacementType: null,
  bookmarks: [],
  activeStamp: null,
  activeStickyNotePlacement: false,
  isInkMode: false,
  isEraserMode: false,
  inkStrokes: [],
  currentStroke: [],
  searchResults: [],
  currentSearchIndex: -1,
  contextMenuPage: null,
  isLoading: false,
  // 8 Features state extensions
  currentTables: [],
  selectedTableIndex: 0,
  piiMatches: [],
  activeMarkupType: "highlight",
  measureMode: null,
  measurePoints: [],
  measureScale: 1.0,
  measureUnit: "in",
  isVisualCropping: false,
  cropCoordsPt: null,
  cropRatio: "free",
  pageBundleCache: new Map(),
  docVersion: 1,
  pendingTargetTab: null,
  pendingSubAction: null,
  shapesSubMode: "shapes"
};

let activeTransformBox = null;
let activeImageBox = null;
let activeCropBox = null;

// DOM Elements
const uploadSection = document.getElementById("uploadSection");
const workspaceSection = document.getElementById("workspaceSection");
const topNavActions = document.getElementById("topNavActions");
const activeFilename = document.getElementById("activeFilename");
const activeDocReturnBanner = document.getElementById("activeDocReturnBanner");
const activeDocBannerName = document.getElementById("activeDocBannerName");
const btnNavToolsDirectory = document.getElementById("btnNavToolsDirectory");
const navBrandLogo = document.getElementById("navBrandLogo");
const toolSearchInput = document.getElementById("toolSearchInput");
const btnClearToolSearch = document.getElementById("btnClearToolSearch");
const toolsCountVisible = document.getElementById("toolsCountVisible");
const toolsEmptySearchState = document.getElementById("toolsEmptySearchState");
const emptySearchQueryText = document.getElementById("emptySearchQueryText");
const dropZone = document.getElementById("dropZone");
const pdfFileInput = document.getElementById("pdfFileInput");
const pdfPageImage = document.getElementById("pdfPageImage");
const interactiveOverlay = document.getElementById("interactiveOverlay");
const inkCanvas = document.getElementById("inkCanvas");
const pageCanvasWrapper = document.getElementById("pageCanvasWrapper");
const pageNumberInput = document.getElementById("pageNumberInput");
const totalPagesSpan = document.getElementById("totalPagesSpan");
const zoomSelect = document.getElementById("zoomSelect");
const canvasStatus = document.getElementById("canvasStatus");
const loadingSpinner = document.getElementById("loadingSpinner");

// Top Nav Controls
const btnSearchToggle = document.getElementById("btnSearchToggle");
const btnUndo = document.getElementById("btnUndo");
const btnRedo = document.getElementById("btnRedo");
const btnReset = document.getElementById("btnReset");
const btnDownload = document.getElementById("btnDownload");
const btnNewDoc = document.getElementById("btnNewDoc");
const btnThemeToggle = document.getElementById("btnThemeToggle");
const btnCommandPalette = document.getElementById("btnCommandPalette");

// Navigation & Preview
const btnToggleThumbnails = document.getElementById("btnToggleThumbnails");
const rightPreviewPanel = document.getElementById("rightPreviewPanel");
const rightPanelResizer = document.getElementById("rightPanelResizer");
const previewList = document.getElementById("previewList");
const btnThumbInsertBlank = document.getElementById("btnThumbInsertBlank");
const btnThumbDuplicate = document.getElementById("btnThumbDuplicate");
const btnPrevPage = document.getElementById("btnPrevPage");
const btnNextPage = document.getElementById("btnNextPage");

// Zoom Controls
const btnZoomIn = document.getElementById("btnZoomIn");
const btnZoomOut = document.getElementById("btnZoomOut");
const btnFitWidth = document.getElementById("btnFitWidth");

// Search Elements
const floatingSearchBar = document.getElementById("floatingSearchBar");
const docSearchInput = document.getElementById("docSearchInput");
const searchMatchCount = document.getElementById("searchMatchCount");
const btnSearchPrev = document.getElementById("btnSearchPrev");
const btnSearchNext = document.getElementById("btnSearchNext");
const btnCloseSearch = document.getElementById("btnCloseSearch");

// Edit & Add Text
const btnToggleInspect = document.getElementById("btnToggleInspect");
const btnApplyFindReplace = document.getElementById("btnApplyFindReplace");
const btnApplyBlockEdit = document.getElementById("btnApplyBlockEdit");
const btnCloseBlockEdit = document.getElementById("btnCloseBlockEdit");
const blockEditorContainer = document.getElementById("blockEditorContainer");
const blockEditText = document.getElementById("blockEditText");
const blockEditSize = document.getElementById("blockEditSize");
const blockEditColor = document.getElementById("blockEditColor");
const blockEditFont = document.getElementById("blockEditFont");
const btnBlockBold = document.getElementById("btnBlockBold");
const btnBlockItalic = document.getElementById("btnBlockItalic");
const blockEditAlign = document.getElementById("blockEditAlign");
const btnAddTextSubmit = document.getElementById("btnAddTextSubmit");
const newTextWithBox = document.getElementById("newTextWithBox");
const newTextBoxOptions = document.getElementById("newTextBoxOptions");

// AcroForms
const formFieldsContainer = document.getElementById("formFieldsContainer");
const btnSaveFormValues = document.getElementById("btnSaveFormValues");
const btnFlattenForms = document.getElementById("btnFlattenForms");
const btnCreateFormField = document.getElementById("btnCreateFormField");

// Redaction & Sanitization
const btnApplyVisualRedact = document.getElementById("btnApplyVisualRedact");
const btnSanitizeDoc = document.getElementById("btnSanitizeDoc");

// Bookmarks
const bookmarksTreeContainer = document.getElementById("bookmarksTreeContainer");
const btnAddBookmark = document.getElementById("btnAddBookmark");

// Ink, Stamps, Notes
const btnToggleInk = document.getElementById("btnToggleInk");
const inkControlsArea = document.getElementById("inkControlsArea");
const btnInkEraser = document.getElementById("btnInkEraser");
const btnInkUndo = document.getElementById("btnInkUndo");
const btnSaveInkStrokes = document.getElementById("btnSaveInkStrokes");
const btnStartStickyNotePlacement = document.getElementById("btnStartStickyNotePlacement");

// Image Placement
const imagePlacementInput = document.getElementById("imagePlacementInput");
const imagePlacementPreview = document.getElementById("imagePlacementPreview");
const placedImagePreviewImg = document.getElementById("placedImagePreviewImg");
const btnInsertImageSubmit = document.getElementById("btnInsertImageSubmit");

// Page Tools
const btnRotateLeft = document.getElementById("btnRotateLeft");
const btnRotateRight = document.getElementById("btnRotateRight");
const btnDeleteCurrentPage = document.getElementById("btnDeleteCurrentPage");
const btnDuplicatePage = document.getElementById("btnDuplicatePage");
const btnInsertBlankPageSubmit = document.getElementById("btnInsertBlankPageSubmit");
const customPageOrder = document.getElementById("customPageOrder");
const btnApplyPageOrder = document.getElementById("btnApplyPageOrder");
const btnApplyPageNumbers = document.getElementById("btnApplyPageNumbers");

// Split, Merge, Watermark, Extract, Optimize
const btnSplitRange = document.getElementById("btnSplitRange");
const btnBurstZip = document.getElementById("btnBurstZip");
const mergeFileInput = document.getElementById("mergeFileInput");
const mergeFileList = document.getElementById("mergeFileList");
const btnExecuteMerge = document.getElementById("btnExecuteMerge");
const btnApplyWatermark = document.getElementById("btnApplyWatermark");
const watermarkOpacity = document.getElementById("watermarkOpacity");
const watermarkOpacityVal = document.getElementById("watermarkOpacityVal");
const btnPreviewText = document.getElementById("btnPreviewText");
const btnDownloadText = document.getElementById("btnDownloadText");
const btnExtractImages = document.getElementById("btnExtractImages");
const btnCompressPdf = document.getElementById("btnCompressPdf");
const btnApplyPassword = document.getElementById("btnApplyPassword");
const btnSaveMetadata = document.getElementById("btnSaveMetadata");

// Context Menu & Command Palette
const thumbnailContextMenu = document.getElementById("thumbnailContextMenu");
const commandPaletteModal = document.getElementById("commandPaletteModal");
const cmdInput = document.getElementById("cmdInput");
const cmdResultsList = document.getElementById("cmdResultsList");

// ==========================================================================
// Initialization
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  setupTabs();
  setupUpload();
  setupViewerControls();
  setupCanvasDrawing();
  setupToolActions();
  setupSearch();
  setupThumbnailsContextMenu();
  setupCommandPalette();
  setupKeyboardShortcuts();
  setupAdvancedFeatures();
  setupPdfCompressionFeature();
  setupLandingToolDirectory();
});

// Theme Toggle
function initTheme() {
  const saved = localStorage.getItem("pdf_studio_theme") || "light";
  document.documentElement.setAttribute("data-theme", saved);
  updateThemeIcon(saved);

  btnThemeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("pdf_studio_theme", next);
    updateThemeIcon(next);
  });
}

function updateThemeIcon(theme) {
  const sun = document.getElementById("themeIconSun");
  const moon = document.getElementById("themeIconMoon");
  if (theme === "dark") {
    sun.style.display = "none";
    moon.style.display = "block";
  } else {
    sun.style.display = "block";
    moon.style.display = "none";
  }
}

// Loading indicator
function setLoading(loading, message = "Processing...") {
  state.isLoading = loading;
  if (loadingSpinner) loadingSpinner.style.display = loading ? "inline-block" : "none";
  if (canvasStatus) canvasStatus.textContent = loading ? message : "Ready";
}

// Toast Notifications
function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  let iconSvg = '';
  if (type === "success") {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === "error" || type === "danger") {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
  } else if (type === "warning") {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
  } else {
    iconSvg = '<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
  }

  toast.innerHTML = `<span class="toast-icon-wrap">${iconSvg}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("toast-hiding");
    setTimeout(() => toast.remove(), 250);
  }, 3500);
}

// Generic Confirmation Modal
function showConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById("confirmModal");
  document.getElementById("confirmModalTitle").textContent = title;
  document.getElementById("confirmModalMessage").textContent = message;
  const btnConfirm = document.getElementById("btnConfirmModalAction");

  // Clone button to strip existing listeners
  const newBtn = btnConfirm.cloneNode(true);
  btnConfirm.parentNode.replaceChild(newBtn, btnConfirm);

  newBtn.addEventListener("click", () => {
    closeModal("confirmModal");
    if (onConfirm) onConfirm();
  });

  openModal("confirmModal");
}

// ==========================================================================
// Tabs & Panels
// ==========================================================================

function setupTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));

      btn.classList.add("active");
      const targetId = btn.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add("active");
      state.activeTab = targetId;

      // Tab specific hooks
      if (targetId === "tab-forms") loadFormFields();
      if (targetId === "tab-bookmarks") loadBookmarks();
      if (targetId === "tab-optimize") loadMetadataAndAudit();
      if (targetId === "tab-protect") updateSecurityTabUI();
      if (targetId === "tab-split" && typeof renderSplitViews === "function") renderSplitViews();

      // Reset specific modes if tab changed
      if (targetId !== "tab-add" && targetId !== "tab-edit" && targetId !== "tab-shapes") {
        cancelTransformBox();
      } else if (targetId === "tab-add") {
        interactiveOverlay.style.cursor = "text";
      }
      if (targetId !== "tab-image") {
        if (activeImageBox) { activeImageBox.remove(); activeImageBox = null; }
        if (activeTransformBox && activeTransformBox.classList.contains("mode-image")) {
          cancelTransformBox();
        }
      }
      if (targetId !== "tab-shapes") {
        if (activeTransformBox && activeTransformBox.classList.contains("mode-shape")) {
          cancelTransformBox();
        }
      }
      if (targetId !== "tab-forms") {
        cancelFormPlacement();
      }
      if (targetId !== "tab-annotate") {
        toggleInkMode(false);
        state.activeStamp = null;
        state.activeStickyNotePlacement = false;
        document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("selected"));
      }
      if (targetId !== "tab-shapes") {
        cancelMeasurement();
      } else {
        interactiveOverlay.style.cursor = "crosshair";
        if (typeof window.setShapesSubMode === "function") {
          window.setShapesSubMode(state.shapesSubMode || "shapes");
        }
      }
      // Dynamic pointer-events syncing
      const isTextInteractive = targetId === "tab-edit" || targetId === "tab-add";
      const isImgInteractive = targetId === "tab-image" || targetId === "tab-edit";
      const isShapeInteractive = targetId === "tab-shapes" || targetId === "tab-edit";
      document.querySelectorAll(".text-block-highlight").forEach(el => el.style.pointerEvents = (isTextInteractive || (state.inspectMode && targetId !== "tab-annotate" && targetId !== "tab-redact")) ? "auto" : "none");
      document.querySelectorAll(".canvas-image-overlay").forEach(el => el.style.pointerEvents = (isImgInteractive || (state.inspectMode && targetId !== "tab-annotate" && targetId !== "tab-redact")) ? "auto" : "none");
      document.querySelectorAll(".shape-annotation-wrapper").forEach(el => el.style.pointerEvents = (isShapeInteractive || (state.inspectMode && targetId !== "tab-annotate" && targetId !== "tab-redact")) ? "auto" : "none");

      if (targetId !== "tab-add" && targetId !== "tab-forms" && targetId !== "tab-annotate" && targetId !== "tab-shapes") {
        interactiveOverlay.style.cursor = "default";
      }
    });
  });
}

// ==========================================================================
// File Upload & Session Loading
// ==========================================================================

function setupUpload() {
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handlePdfUpload(e.dataTransfer.files[0]);
    }
  });

  pdfFileInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handlePdfUpload(e.target.files[0]);
    }
  });

  btnNewDoc.addEventListener("click", () => {
    pdfFileInput.value = "";
    pdfFileInput.click();
  });
}

async function handlePdfUpload(file, password = null) {
  if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
    showToast("Please select a valid PDF file.", "error");
    return;
  }

  // If a document was already open, securely purge it from server memory/disk
  if (state.docId) {
    const oldDocId = state.docId;
    fetch(`/api/document/${oldDocId}/close`, { method: "POST", keepalive: true }).catch(() => {});
  }

  showToast("Uploading and parsing document...", "info");
  setLoading(true, "Parsing PDF...");
  const formData = new FormData();
  formData.append("file", file);
  if (password) {
    formData.append("password", password);
  }

  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to upload document");
    }

    const data = await res.json();
    state.docId = data.doc_id;
    state.filename = data.filename;
    state.docInfo = data.info;
    state.fileSize = file.size;

    if (data.requires_password || (data.info && data.info.is_encrypted && data.info.page_count === 0)) {
      openPasswordPromptModal(data.filename);
      return;
    }

    state.totalPages = data.info.page_count;
    state.currentPage = 1;

    activeFilename.textContent = state.filename;
    totalPagesSpan.textContent = state.totalPages;
    pageNumberInput.value = 1;
    pageNumberInput.max = state.totalPages;

    const firstPage = state.docInfo && state.docInfo.pages && state.docInfo.pages[0];
    if (firstPage) {
      state.pageWidthPt = firstPage.width;
      state.pageHeightPt = firstPage.height;
    }

    uploadSection.style.display = "none";
    workspaceSection.style.display = "flex";
    topNavActions.style.display = "flex";

    // Auto-fit page on initial document load
    state.zoom = calculateOptimalZoom("fit-page");
    updateZoomSelectLabel();

    updateUndoRedoButtons(false, false);
    updatePageOrderInput();
    if (typeof splitState !== "undefined") {
      splitState.selectedPages.clear();
      splitState.lastClickedPage = null;
    }
    populateThumbnails();
    if (typeof renderSplitViews === "function") renderSplitViews();
    await loadPage(state.currentPage);
    updateSecurityTabUI();
    showToast("Document loaded into studio!", "success");

    if (state.pendingTargetTab) {
      const pendingTab = state.pendingTargetTab;
      const pendingSub = state.pendingSubAction;
      state.pendingTargetTab = null;
      state.pendingSubAction = null;
      setTimeout(() => {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${pendingTab}"]`);
        if (tabBtn) tabBtn.click();
        if (pendingTab === "tab-shapes") {
          if (pendingSub === "ruler") {
            if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("ruler");
          } else {
            if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("shapes");
          }
        }
      }, 150);
    }
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(false);
  }
}

function updatePageOrderInput() {
  const pages = Array.from({ length: state.totalPages }, (_, i) => i + 1);
  if (customPageOrder) customPageOrder.value = pages.join(", ");
}

function invalidatePageCache() {
  if (state.pageBundleCache) state.pageBundleCache.clear();
  state.docVersion = (state.docVersion || 1) + 1;
}

function updateUndoRedoButtons(canUndo, canRedo) {
  if (canUndo) invalidatePageCache();
  if (btnUndo) btnUndo.disabled = !canUndo;
  if (btnRedo) btnRedo.disabled = !canRedo;
}

// ==========================================================================
// High-Speed Page Loading, Bundling & Caching (Hardware-Decoded)
// ==========================================================================

const MAX_BUNDLE_CACHE_SIZE = 25;

async function fetchPageBundle(pageNumber) {
  const cacheKey = `${state.docId}_v${state.docVersion || 1}_p${pageNumber}_z${state.zoom}`;
  if (state.pageBundleCache && state.pageBundleCache.has(cacheKey)) {
    return state.pageBundleCache.get(cacheKey);
  }

  const res = await fetch(`/api/document/${state.docId}/page/${pageNumber}/bundle?zoom=${state.zoom}&v=${state.docVersion || 1}`);
  if (!res.ok) throw new Error(`Failed to load page ${pageNumber} bundle`);
  const bundle = await res.json();
  if (state.pageBundleCache) {
    if (state.pageBundleCache.size >= MAX_BUNDLE_CACHE_SIZE) {
      const oldestKey = state.pageBundleCache.keys().next().value;
      state.pageBundleCache.delete(oldestKey);
    }
    state.pageBundleCache.set(cacheKey, bundle);
  }
  return bundle;
}

function prefetchPageBundle(pageNumber) {
  if (!state.docId || pageNumber < 1 || pageNumber > state.totalPages) return;
  const cacheKey = `${state.docId}_v${state.docVersion || 1}_p${pageNumber}_z${state.zoom}`;
  if (state.pageBundleCache && state.pageBundleCache.has(cacheKey)) return;

  fetch(`/api/document/${state.docId}/page/${pageNumber}/bundle?zoom=${state.zoom}&v=${state.docVersion || 1}`)
    .then(res => res.ok ? res.json() : null)
    .then(async (bundle) => {
      if (bundle && state.pageBundleCache) {
        if (bundle.image_data_url) {
          const preImg = new Image();
          preImg.src = bundle.image_data_url;
          if (preImg.decode) preImg.decode().catch(() => {});
        }
        if (state.pageBundleCache.size >= MAX_BUNDLE_CACHE_SIZE) {
          const oldestKey = state.pageBundleCache.keys().next().value;
          state.pageBundleCache.delete(oldestKey);
        }
        state.pageBundleCache.set(cacheKey, bundle);
      }
    })
    .catch(() => {});
}

async function applyPageBundleDirectly(pageNumber, bundle) {
  if (!state.docId || !bundle) return;
  state.currentPage = pageNumber;
  pageNumberInput.value = pageNumber;
  updateZoomSelectLabel();

  // Cache this bundle in memory
  const cacheKey = `${state.docId}_v${state.docVersion || 1}_p${pageNumber}_z${state.zoom}`;
  if (state.pageBundleCache) {
    if (state.pageBundleCache.size >= MAX_BUNDLE_CACHE_SIZE) {
      const oldestKey = state.pageBundleCache.keys().next().value;
      state.pageBundleCache.delete(oldestKey);
    }
    state.pageBundleCache.set(cacheKey, bundle);
  }

  const viewport = document.getElementById("canvasViewport");
  const canvasWrapper = document.getElementById("pageCanvasWrapper");
  const savedScrollTop  = viewport ? viewport.scrollTop  : 0;
  const savedScrollLeft = viewport ? viewport.scrollLeft : 0;
  const savedWinY = window.scrollY || document.documentElement.scrollTop || 0;
  const savedWinX = window.scrollX || document.documentElement.scrollLeft || 0;

  if (canvasWrapper && pdfPageImage && pdfPageImage.offsetHeight > 0) {
    canvasWrapper.style.minHeight = `${pdfPageImage.offsetHeight}px`;
    canvasWrapper.style.minWidth = `${pdfPageImage.offsetWidth}px`;
  }

  try {
    // Hardware pre-decode image off-thread to avoid any white blink or frame hitch
    if (bundle.image_data_url) {
      const preloadImg = new Image();
      preloadImg.src = bundle.image_data_url;
      try {
        if (preloadImg.decode) {
          await preloadImg.decode();
        } else if (!preloadImg.complete) {
          await new Promise(r => { preloadImg.onload = r; preloadImg.onerror = r; });
        }
      } catch (_) {}
    }

    pdfPageImage.src = bundle.image_data_url;

    if (canvasWrapper) {
      canvasWrapper.style.minHeight = "";
      canvasWrapper.style.minWidth = "";
    }

    state.pageWidthPt = bundle.width || (state.docInfo?.pages?.[pageNumber - 1]?.width) || 595;
    state.pageHeightPt = bundle.height || (state.docInfo?.pages?.[pageNumber - 1]?.height) || 842;

    cancelTransformBox();
    syncActiveThumbnail(pageNumber);

    if (state.isVisualCropping && state.cropCoordsPt) {
      syncCropBoxToScreen();
    }

    state.textBlocks = bundle.text_blocks || [];
    renderBlockHighlights();

    state.pageImages = bundle.images || [];
    renderPageImageOverlays(pageNumber);

    state.annotations = bundle.annotations || [];
    renderAnnotationOverlays(pageNumber);

    renderSearchHighlights();
    renderPiiHighlights();

    if (viewport) {
      viewport.scrollTop  = savedScrollTop;
      viewport.scrollLeft = savedScrollLeft;
    }
    window.scrollTo(savedWinX, savedWinY);

    requestAnimationFrame(() => {
      if (viewport) {
        viewport.scrollTop  = savedScrollTop;
        viewport.scrollLeft = savedScrollLeft;
      }
      window.scrollTo(savedWinX, savedWinY);
    });

    if (state.activeTab === "tab-forms" || (state.formFields && state.formFields.length > 0)) {
      loadFormFields().catch(() => {});
    }
    if (state.isInkMode) syncInkCanvasSize();

    // Speculatively prefetch adjacent and secondary pages during idle time
    const prefetchTargets = [pageNumber + 1, pageNumber - 1, pageNumber + 2, pageNumber - 2];
    prefetchTargets.forEach((p, idx) => {
      if (p >= 1 && p <= state.totalPages) {
        setTimeout(() => prefetchPageBundle(p), (idx + 1) * 120);
      }
    });
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    if (canvasWrapper) {
      canvasWrapper.style.minHeight = "";
      canvasWrapper.style.minWidth = "";
    }
    if (viewport) {
      viewport.scrollTop  = savedScrollTop;
      viewport.scrollLeft = savedScrollLeft;
    }
    window.scrollTo(savedWinX, savedWinY);
    setLoading(false);
  }
}

async function applyMutationResponse(data, targetPage = state.currentPage) {
  if (data && data.version !== undefined) {
    state.docVersion = data.version;
  } else {
    state.docVersion = (state.docVersion || 1) + 1;
  }
  if (state.pageBundleCache) {
    state.pageBundleCache.clear();
  }
  const canUndo = data && data.can_undo !== undefined ? data.can_undo : true;
  const canRedo = data && data.can_redo !== undefined ? data.can_redo : false;
  updateUndoRedoButtons(canUndo, canRedo);

  if (data && data.info) {
    state.docInfo = data.info;
    state.totalPages = data.info.page_count || state.totalPages;
  }

  if (data && data.page_bundle && targetPage === state.currentPage) {
    await applyPageBundleDirectly(targetPage, data.page_bundle);
  } else {
    await loadPage(targetPage || state.currentPage);
  }
}

async function loadPage(pageNumber, _opts = {}) {
  if (!state.docId) return;

  const cacheKey = `${state.docId}_v${state.docVersion || 1}_p${pageNumber}_z${state.zoom}`;
  const isCached = state.pageBundleCache && state.pageBundleCache.has(cacheKey);
  if (!isCached) {
    setLoading(true, `Loading Page ${pageNumber}...`);
  }

  try {
    const bundle = await fetchPageBundle(pageNumber);
    await applyPageBundleDirectly(pageNumber, bundle);
  } catch (err) {
    showToast(err.message, "error");
    setLoading(false);
  }
}



// ==========================================================================
// Canonical Coordinate Transformations (Screen / Overlay <-> PDF Points)
// ==========================================================================

function getOverlayScale() {
  const overlay = document.getElementById("interactiveOverlay");
  const overlayRect = overlay ? overlay.getBoundingClientRect() : { width: 595, height: 842, left: 0, top: 0 };
  const pWidth = state.pageWidthPt || 595;
  const pHeight = state.pageHeightPt || 842;
  const scaleX = overlayRect.width > 0 ? overlayRect.width / pWidth : (state.zoom || 1.0);
  const scaleY = overlayRect.height > 0 ? overlayRect.height / pHeight : (state.zoom || 1.0);
  return { overlay, overlayRect, pWidth, pHeight, scaleX, scaleY };
}

function screenToPagePoint(clientX, clientY) {
  const { overlayRect, scaleX, scaleY } = getOverlayScale();
  const relX = clientX - overlayRect.left;
  const relY = clientY - overlayRect.top;
  return {
    x: scaleX > 0 ? relX / scaleX : relX,
    y: scaleY > 0 ? relY / scaleY : relY
  };
}

function pageToScreenPoint(ptX, ptY) {
  const { scaleX, scaleY } = getOverlayScale();
  return {
    left: ptX * scaleX,
    top: ptY * scaleY
  };
}

function pageToScreenRect(bbox) {
  const [x0, y0, x1, y1] = bbox;
  const { scaleX, scaleY } = getOverlayScale();
  return {
    left: x0 * scaleX,
    top: y0 * scaleY,
    width: Math.max((x1 - x0) * scaleX, 10),
    height: Math.max((y1 - y0) * scaleY, 10)
  };
}

function screenOverlayToPagePoint(overlayLeftPx, overlayTopPx) {
  const { scaleX, scaleY } = getOverlayScale();
  return {
    x: scaleX > 0 ? overlayLeftPx / scaleX : overlayLeftPx,
    y: scaleY > 0 ? overlayTopPx / scaleY : overlayTopPx
  };
}

async function loadPageImages(pageNumber) {
  if (!state.docId) return;
  try {
    const res = await fetch(`/api/document/${state.docId}/page/${pageNumber}/images`);
    if (!res.ok) return;
    const data = await res.json();
    state.pageImages = data.images || [];
    renderPageImageOverlays(pageNumber);
  } catch (err) {
    console.error("Images load error:", err);
  }
}

function renderPageImageOverlays(pageNumber) {
  interactiveOverlay.querySelectorAll(".canvas-image-overlay").forEach(el => el.remove());
  if (!state.pageImages || state.pageImages.length === 0) return;

  const overlayRect = interactiveOverlay.getBoundingClientRect();
  if (overlayRect.width === 0 || overlayRect.height === 0) {
    setTimeout(() => renderPageImageOverlays(pageNumber), 50);
    return;
  }

  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;
  const isImgInteractive = state.activeTab === "tab-image" || state.activeTab === "tab-edit" || (state.inspectMode && state.activeTab !== "tab-annotate" && state.activeTab !== "tab-redact");

  state.pageImages.forEach((img, idx) => {
    const [x0, y0, x1, y1] = img.bbox;
    const left = x0 * scaleX;
    const top = y0 * scaleY;
    const origW = Math.max(x1 - x0, 10);
    const origH = Math.max(y1 - y0, 10);
    const w = origW * scaleX;
    const h = origH * scaleY;

    const div = document.createElement("div");
    div.className = "canvas-image-overlay";
    div.style.left = `${left}px`;
    div.style.top = `${top}px`;
    div.style.width = `${Math.max(w, 24)}px`;
    div.style.height = `${Math.max(h, 20)}px`;
    div.style.pointerEvents = isImgInteractive ? "auto" : "none";
    div.title = `Image #${idx + 1} (${Math.round(origW)}×${Math.round(origH)}pt). Click to move, resize, rotate, replace, or delete.`;
    div._bbox = img.bbox;
    div._xref = img.xref;

    // Click to open live transform & move box
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      initLiveImageTransformBox({
        mode: "existing",
        leftPx: left,
        topPx: top,
        widthPx: Math.max(w, 40),
        heightPx: Math.max(h, 30),
        bbox: img.bbox,
        xref: img.xref,
        orig_width: img.orig_width,
        orig_height: img.orig_height,
        opacity: img.opacity !== undefined ? img.opacity : 1.0,
        imgSrc: img.image_url || `/api/document/${state.docId}/image/${img.xref}`,
        divElement: div
      });
    });

    interactiveOverlay.appendChild(div);
  });
}

async function loadTextBlocks(pageNumber) {
  try {
    const res = await fetch(`/api/document/${state.docId}/page/${pageNumber}/text-blocks`);
    if (!res.ok) return;
    const data = await res.json();
    state.textBlocks = data.blocks || [];
    renderBlockHighlights();
  } catch (err) {
    console.error("Failed to load text blocks:", err);
  }
}

function renderBlockHighlights() {
  interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(el => el.remove());
  if (!state.inspectMode || state.textBlocks.length === 0) return;

  const overlayRect = interactiveOverlay.getBoundingClientRect();
  if (overlayRect.width === 0 || overlayRect.height === 0) {
    setTimeout(renderBlockHighlights, 50);
    return;
  }

  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;
  const isTextInteractive = state.activeTab === "tab-edit" || state.activeTab === "tab-add";
  const isPointerAllowed = isTextInteractive || (state.inspectMode && state.activeTab !== "tab-annotate" && state.activeTab !== "tab-redact");

  state.textBlocks.forEach(block => {
    const [x0, y0, x1, y1] = block.bbox;
    const left = x0 * scaleX;
    const top = y0 * scaleY;
    const origW = x1 - x0;
    const origH = y1 - y0;
    const width = Math.max(origW * scaleX, 14);
    const height = Math.max(origH * scaleY, 10);

    const div = document.createElement("div");
    div.className = "text-block-highlight";
    div.dataset.blockId = block.id;
    div.style.left = `${left}px`;
    div.style.top = `${top}px`;
    div.style.width = `${width}px`;
    div.style.height = `${height}px`;
    div.style.pointerEvents = isPointerAllowed ? "auto" : "none";
    div.title = `Click to transform, resize, move, or edit text`;

    const handle = document.createElement("div");
    handle.className = "text-block-drag-handle";
    handle.innerHTML = `<span><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="5 9 2 12 5 15"/><polyline points="9 5 12 2 15 5"/><polyline points="15 19 12 22 9 19"/><polyline points="19 9 22 12 19 15"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="12" y1="2" x2="12" y2="22"/></svg> Move</span>`;
    div.appendChild(handle);

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      selectBlockForEdit(block, div);
    });

    let blockMask = null;

    // Make text block completely movable at any given time with backdrop masking
    makeDraggable(div, handle, async (finalX, finalY, finalW, finalH, moved) => {
      if (!moved) {
        if (blockMask) {
          blockMask.remove();
          blockMask = null;
        }
        div.classList.remove("is-dragging");
        return;
      }
      const newPtX0 = Math.round(finalX / scaleX);
      const newPtY0 = Math.round(finalY / scaleY);
      const newPtX1 = Math.round(newPtX0 + origW);
      const newPtY1 = Math.round(newPtY0 + origH);
      const newBbox = [newPtX0, newPtY0, newPtX1, newPtY1];

      setLoading(true, "Moving text block on PDF...");
      try {
        const res = await fetch(`/api/document/${state.docId}/edit-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            edits: [{
              page: state.currentPage,
              bbox: block.bbox,
              lines: block.lines,
              new_bbox: newBbox,
              new_text: block.text,
              font_size: block.avg_font_size || block.font_size || 11,
              font_name: block.font_name || "helv",
              text_color: block.color || [0, 0, 0],
              bg_color: null
            }]
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to move text block");
        }
        const data = await res.json();
        showToast(`Text block moved to (${newPtX0}, ${newPtY0})`, "success");
        await applyMutationResponse(data, state.currentPage);
      } catch (err) {
        if (blockMask) {
          blockMask.remove();
          blockMask = null;
        }
        div.classList.remove("is-dragging");
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }, null, (startX, startY, startW, startH) => {
      if (!blockMask) {
        blockMask = document.createElement("div");
        blockMask.className = "element-underlying-mask text-underlying-mask";
        blockMask.style.left = `${startX}px`;
        blockMask.style.top = `${startY}px`;
        blockMask.style.width = `${startW}px`;
        blockMask.style.height = `${startH}px`;
        interactiveOverlay.insertBefore(blockMask, div);
      }
      div.classList.add("is-dragging");
    });

    interactiveOverlay.appendChild(div);
  });
}

// Annotation Overlays Loader & Movement
async function loadAnnotations(pageNumber) {
  if (!state.docId) return;
  try {
    const res = await fetch(`/api/document/${state.docId}/page/${pageNumber}/annotations`);
    if (!res.ok) return;
    const data = await res.json();
    state.annotations = data.annotations || [];
    renderAnnotationOverlays(pageNumber);
  } catch (err) {
    console.error("Annotations load error:", err);
  }
}

function renderAnnotationOverlays(pageNumber) {
  interactiveOverlay.querySelectorAll(".annotation-overlay-wrapper").forEach(el => el.remove());
  if (!state.annotations || state.annotations.length === 0) return;

  const overlayRect = interactiveOverlay.getBoundingClientRect();
  if (overlayRect.width === 0 || overlayRect.height === 0) {
    setTimeout(() => renderAnnotationOverlays(pageNumber), 50);
    return;
  }

  state.annotations.forEach(annot => {
    const [x0, y0, x1, y1] = annot.rect;
    const origW = Math.max(x1 - x0, 10);
    const origH = Math.max(y1 - y0, 10);
    const screenRect = pageToScreenRect(annot.rect);

    const wrapper = document.createElement("div");
    wrapper.className = "annotation-overlay-wrapper";
    if (annot.type === "Text") wrapper.classList.add("sticky-note-wrapper");
    wrapper.style.left = `${screenRect.left}px`;
    wrapper.style.top = `${screenRect.top}px`;
    wrapper.style.width = `${screenRect.width}px`;
    wrapper.style.height = `${screenRect.height}px`;
    wrapper.title = `${annot.type}: ${annot.content || annot.name || annot.title || ""}`;

    // Subtle UI for ALL annotations
    wrapper.style.border = "2px solid transparent";
    wrapper.style.background = "transparent";
    wrapper.style.boxShadow = "none";
    
    // Add subtle hover border
    wrapper.addEventListener("mouseenter", () => {
      if (annot.type !== "Text") wrapper.style.border = "2px dashed rgba(139, 92, 246, 0.6)";
      const delBtn = wrapper.querySelector(".annot-del-btn");
      if (delBtn) delBtn.style.display = "flex";
    });
    wrapper.addEventListener("mouseleave", () => {
      if (!wrapper.classList.contains("is-dragging")) {
        wrapper.style.border = "2px solid transparent";
      }
      const delBtn = wrapper.querySelector(".annot-del-btn");
      if (delBtn) delBtn.style.display = "none";
    });

    const isShapeAnnot = ["Square", "Rect", "Circle", "Line", "Polygon", "PolyLine"].includes(annot.type);
    if (annot.type === "Text") {
      wrapper.innerHTML = `<div class="sticky-note-icon" style="cursor: grab; display: flex; align-items: center; justify-content: center; width: 26px; height: 26px; background: #f59e0b; color: #fff; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>`;
    } else if (isShapeAnnot) {
      wrapper.classList.add("shape-annotation-wrapper");
      wrapper.dataset.annotIndex = String(annot.index);
      wrapper.style.cursor = "pointer";
      wrapper.title = `${annot.type} Shape: Click to edit shape`;
      wrapper.addEventListener("click", (e) => {
        if (state.activeTab === "tab-annotate" || state.activeTab === "tab-redact") return;
        e.stopPropagation();
        if (typeof selectShapeForEdit === "function") {
          selectShapeForEdit(annot, wrapper);
        }
      });
    } else {
      wrapper.style.cursor = "grab";
      wrapper.addEventListener("mousedown", () => wrapper.style.cursor = "grabbing");
      wrapper.addEventListener("mouseup", () => wrapper.style.cursor = "grab");
    }

    // Universal delete button for all annotations
    const delHtml = `<button class="annot-del-btn" style="position:absolute; top:-8px; right:-8px; background:#ef4444; border:none; border-radius:50%; color:#fff; width:16px; height:16px; cursor:pointer; display:none; align-items:center; justify-content:center; padding:0; box-shadow: 0 1px 3px rgba(0,0,0,0.3); z-index: 20;" title="Delete"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
    wrapper.insertAdjacentHTML('beforeend', delHtml);

    const delBtn = wrapper.querySelector(".annot-del-btn");
    if (delBtn) {
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        showConfirmModal("Delete Annotation", `Remove this ${annot.type} annotation?`, async () => {
          setLoading(true, "Deleting annotation...");
          try {
            const res = await fetch(`/api/document/${state.docId}/annotations/delete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ page: state.currentPage, index: annot.index })
            });
            if (!res.ok) throw new Error("Failed to delete annotation");
            const data = await res.json();
            showToast("Annotation removed!", "info");
            await applyMutationResponse(data, state.currentPage);
          } catch (err) {
            showToast(err.message, "error");
          } finally {
            setLoading(false);
          }
        });
      });
    }

    // Make the annotation completely movable at any given time (except text markup)
    const isTextMarkup = ["Highlight", "Underline", "StrikeOut", "Squiggly"].includes(annot.type);
    if (!isTextMarkup) {
      const dragHandle = annot.type === "Text" ? wrapper.querySelector(".sticky-note-icon") : wrapper;
      let annotMask = null;

      makeDraggable(wrapper, dragHandle, async (finalX, finalY, finalW, finalH, moved) => {
        if (!moved) {
          if (annotMask) {
            annotMask.remove();
            annotMask = null;
          }
          wrapper.classList.remove("is-dragging");
          return;
        }

        const pt0 = screenOverlayToPagePoint(finalX, finalY);
        const newPtX0 = Math.round(pt0.x);
        const newPtY0 = Math.round(pt0.y);
        const newPtX1 = Math.round(newPtX0 + origW);
        const newPtY1 = Math.round(newPtY0 + origH);
        const newBbox = [newPtX0, newPtY0, newPtX1, newPtY1];

        setLoading(true, `Moving ${annot.type} annotation...`);
        try {
          const res = await fetch(`/api/document/${state.docId}/annotations/move`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: state.currentPage,
              index: annot.index,
              bbox: newBbox
            })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || "Failed to move annotation");
          }
          const data = await res.json();
          annot.rect = newBbox;
          showToast(`Moved ${annot.type} annotation to (${newPtX0}, ${newPtY0})`, "info");
          await applyMutationResponse(data, state.currentPage);
        } catch (err) {
          if (annotMask) {
            annotMask.remove();
            annotMask = null;
          }
          wrapper.classList.remove("is-dragging");
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      }, null, (startX, startY, startW, startH) => {
        if (!annotMask) {
          annotMask = document.createElement("div");
          annotMask.className = "element-underlying-mask annotation-underlying-mask";
          annotMask.style.left = `${startX}px`;
          annotMask.style.top = `${startY}px`;
          annotMask.style.width = `${startW}px`;
          annotMask.style.height = `${startH}px`;
          interactiveOverlay.insertBefore(annotMask, wrapper);
        }
        wrapper.classList.add("is-dragging");
      });
    }

    interactiveOverlay.appendChild(wrapper);
  });
}

function selectBlockForEdit(block, divElement) {
  interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(d => d.classList.remove("selected"));
  if (divElement) divElement.classList.add("selected");

  // Activate tab-edit panel if not active
  if (state.activeTab !== "tab-edit") {
    const editTabBtn = document.querySelector('[data-tab="tab-edit"]');
    if (editTabBtn) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      editTabBtn.classList.add("active");
      const targetPane = document.getElementById("tab-edit");
      if (targetPane) targetPane.classList.add("active");
      state.activeTab = "tab-edit";
    }
  }

  state.selectedBlock = block;
  blockEditText.value = block.text;
  blockEditSize.value = block.font_size || block.avg_font_size || 12;

  // Accurately populate text color
  let hexCol = "#000000";
  if (block.hex_color) {
    hexCol = block.hex_color;
  } else if (block.color && Array.isArray(block.color)) {
    const r = Math.round(block.color[0] * 255);
    const g = Math.round(block.color[1] * 255);
    const b = Math.round(block.color[2] * 255);
    hexCol = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  blockEditColor.value = hexCol;

  // Populate font family
  let fontVal = "helv";
  if (blockEditFont) {
    const fn = (block.font_name || block.raw_font || "").toLowerCase();
    if (fn.includes("time") || fn.includes("roman") || fn.includes("serif") || fn.includes("tiro") || fn.includes("tibo")) {
      fontVal = "times";
    } else if (fn.includes("couri") || fn.includes("mono") || fn.includes("code") || fn.includes("cour") || fn.includes("cobo")) {
      fontVal = "couri";
    } else if (fn.includes("helv") || fn.includes("arial") || fn.includes("sans") || fn.includes("hebo")) {
      fontVal = "helv";
    }
    blockEditFont.value = fontVal;
  }

  // Populate bold / italic styles
  if (btnBlockBold) {
    btnBlockBold.classList.toggle("active", Boolean(block.is_bold));
    if (block.is_bold) {
      btnBlockBold.style.backgroundColor = "var(--primary, #3b82f6)";
      btnBlockBold.style.color = "#ffffff";
    } else {
      btnBlockBold.style.backgroundColor = "";
      btnBlockBold.style.color = "";
    }
  }

  if (btnBlockItalic) {
    btnBlockItalic.classList.toggle("active", Boolean(block.is_italic));
    if (block.is_italic) {
      btnBlockItalic.style.backgroundColor = "var(--primary, #3b82f6)";
      btnBlockItalic.style.color = "#ffffff";
    } else {
      btnBlockItalic.style.backgroundColor = "";
      btnBlockItalic.style.color = "";
    }
  }

  if (blockEditAlign) {
    blockEditAlign.value = "0";
  }

  blockEditorContainer.style.display = "block";

  // Spawn in-place live canvas transform box directly over the text block!
  const overlayRect = interactiveOverlay.getBoundingClientRect();
  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;

  const [x0, y0, x1, y1] = block.bbox;
  const origW = (x1 - x0) * scaleX;
  const origH = (y1 - y0) * scaleY;
  const leftPx = x0 * scaleX;
  const topPx = y0 * scaleY;
  const fontSize = block.font_size || block.avg_font_size || 12;
  const fontSizePx = Math.max(12, fontSize * scaleY);
  const textLines = (block.text || "").split("\n").length;
  const widthPx = Math.max(origW + 14, 140);
  const heightPx = Math.max(origH + 6, fontSizePx * 1.35 * textLines + 10);

  initLiveTextTransformBox({
    mode: "edit",
    leftPx: leftPx,
    topPx: topPx,
    widthPx: widthPx,
    heightPx: heightPx,
    text: block.text,
    fontSize: fontSize,
    fontName: fontVal,
    textColor: hexCol,
    isBold: Boolean(block.is_bold),
    isItalic: Boolean(block.is_italic),
    align: 0,
    origBlock: block,
    divElement: divElement
  });
}

// ==========================================================================
// Viewer Controls (Zoom, Page Nav, Resizer)
// ==========================================================================

function setupViewerControls() {
  if (btnToggleThumbnails) {
    btnToggleThumbnails.addEventListener("click", () => {
      if (rightPreviewPanel) rightPreviewPanel.classList.toggle("hidden");
      if (rightPanelResizer) rightPanelResizer.classList.toggle("hidden");
    });
  }

  setupResizer();

  // Page navigation buttons
  if (btnPrevPage) {
    btnPrevPage.addEventListener("click", () => {
      if (state.currentPage > 1) loadPage(state.currentPage - 1);
    });
  }
  if (btnNextPage) {
    btnNextPage.addEventListener("click", () => {
      if (state.currentPage < state.totalPages) loadPage(state.currentPage + 1);
    });
  }

  pageNumberInput.addEventListener("change", (e) => {
    let p = parseInt(e.target.value);
    if (isNaN(p)) p = 1;
    p = Math.max(1, Math.min(p, state.totalPages));
    loadPage(p);
  });

  // Zoom controls
  btnZoomIn.addEventListener("click", () => {
    if (state.zoom < 2.5) {
      state.zoom = +(state.zoom + 0.25).toFixed(2);
      updateZoom();
    }
  });

  btnZoomOut.addEventListener("click", () => {
    if (state.zoom > 0.5) {
      state.zoom = +(state.zoom - 0.25).toFixed(2);
      updateZoom();
    }
  });

  if (zoomSelect) {
    zoomSelect.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val === "fit-width") {
        fitToWidth();
      } else if (val === "fit-page") {
        fitToPage();
      } else {
        state.zoom = parseFloat(val) || 1.0;
        updateZoom();
      }
    });
  }

  btnFitWidth.addEventListener("click", fitToWidth);

  // Ctrl + MouseWheel zoom on canvas
  const canvasViewport = document.getElementById("canvasViewport");
  if (canvasViewport) {
    canvasViewport.addEventListener("wheel", (e) => {
      if (e.ctrlKey) {
        e.preventDefault();
        if (e.deltaY < 0 && state.zoom < 2.5) {
          state.zoom = +(state.zoom + 0.15).toFixed(2);
          updateZoom();
        } else if (e.deltaY > 0 && state.zoom > 0.4) {
          state.zoom = +(state.zoom - 0.15).toFixed(2);
          updateZoom();
        }
      }
    }, { passive: false });
  }

  btnToggleInspect.addEventListener("click", () => {
    state.inspectMode = !state.inspectMode;
    if (state.inspectMode) {
      btnToggleInspect.classList.add("active");
      btnToggleInspect.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg> Text Block Inspector: ON`;
      interactiveOverlay.style.display = "block";
      renderBlockHighlights();
    } else {
      btnToggleInspect.classList.remove("active");
      btnToggleInspect.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg> Text Block Inspector: OFF`;
      interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(el => el.remove());
    }
  });

  // Top bar Undo / Redo / Revert / Download
  if (btnUndo) {
    btnUndo.addEventListener("click", async () => {
      if (!state.docId) return;
      setLoading(true, "Undoing change...");
      try {
        const res = await fetch(`/api/document/${state.docId}/undo?page=${state.currentPage}&zoom=${state.zoom}`, { method: "POST" });
        if (!res.ok) throw new Error("Undo failed");
        const data = await res.json();
        deselectFormField();
        showToast("Undone last change.", "info");
        await applyMutationResponse(data, state.currentPage);
        await loadFormFields();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  if (btnRedo) {
    btnRedo.addEventListener("click", async () => {
      if (!state.docId) return;
      setLoading(true, "Redoing change...");
      try {
        const res = await fetch(`/api/document/${state.docId}/redo?page=${state.currentPage}&zoom=${state.zoom}`, { method: "POST" });
        if (!res.ok) throw new Error("Redo failed");
        const data = await res.json();
        deselectFormField();
        showToast("Redone operation.", "info");
        await applyMutationResponse(data, state.currentPage);
        await loadFormFields();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      showConfirmModal("Revert Document", "Revert document back to its original uploaded state? All changes will be reset.", async () => {
        setLoading(true, "Reverting to original...");
        try {
          const res = await fetch(`/api/document/${state.docId}/revert`, { method: "POST" });
          if (!res.ok) throw new Error("Revert failed");
          const data = await res.json();
          state.docInfo = data.info;
          state.totalPages = data.info.page_count;
          totalPagesSpan.textContent = state.totalPages;
          pageNumberInput.max = state.totalPages;
          updateUndoRedoButtons(false, false);
          updatePageOrderInput();
          populateThumbnails();
          deselectFormField();
          showToast("Reverted to original document.", "info");
          await loadPage(1);
          await loadFormFields();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      });
    });
  }

  if (btnDownload) {
    btnDownload.addEventListener("click", () => {
      if (!state.docId) return;
      window.location.href = `/api/document/${state.docId}/download`;
    });
  }
}

function calculateOptimalZoom(fitType = "fit-page") {
  const viewport = document.getElementById("canvasViewport");
  const pWidth = state.pageWidthPt || 595;
  const pHeight = state.pageHeightPt || 842;
  
  if (!viewport) return 1.0;
  const availableW = Math.max(200, viewport.clientWidth - 48);
  const availableH = Math.max(200, viewport.clientHeight - 48);

  const scaleW = +(availableW / pWidth).toFixed(2);
  const scaleH = +(availableH / pHeight).toFixed(2);

  if (fitType === "fit-width") {
    return Math.max(0.4, Math.min(2.5, scaleW));
  } else {
    // Fit entire page in viewport
    return Math.max(0.4, Math.min(2.0, Math.min(scaleW, scaleH)));
  }
}

function fitToWidth() {
  state.zoom = calculateOptimalZoom("fit-width");
  updateZoomSelectLabel();
  loadPage(state.currentPage);
}

function fitToPage() {
  state.zoom = calculateOptimalZoom("fit-page");
  updateZoomSelectLabel();
  loadPage(state.currentPage);
}

function updateZoomSelectLabel() {
  if (!zoomSelect) return;
  const matchOpt = Array.from(zoomSelect.options).find(o => parseFloat(o.value) === state.zoom);
  if (matchOpt) {
    zoomSelect.value = matchOpt.value;
  } else {
    let customOpt = zoomSelect.querySelector("option[data-custom='true']");
    if (!customOpt) {
      customOpt = document.createElement("option");
      customOpt.setAttribute("data-custom", "true");
      zoomSelect.appendChild(customOpt);
    }
    customOpt.value = state.zoom;
    customOpt.textContent = `${Math.round(state.zoom * 100)}%`;
    zoomSelect.value = state.zoom;
  }
}

function updateZoom() {
  updateZoomSelectLabel();
  loadPage(state.currentPage);
}

// ==========================================================================
// Document Search System
// ==========================================================================

function setupSearch() {
  if (btnSearchToggle) {
    btnSearchToggle.addEventListener("click", toggleSearchBar);
  }
  if (btnCloseSearch) {
    btnCloseSearch.addEventListener("click", closeSearchBar);
  }

  if (docSearchInput) {
    docSearchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (e.shiftKey) prevSearchMatch();
        else nextSearchMatch();
      }
      if (e.key === "Escape") closeSearchBar();
    });

    let debounceTimer;
    docSearchInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => performSearch(e.target.value), 250);
    });
  }

  if (btnSearchNext) btnSearchNext.addEventListener("click", nextSearchMatch);
  if (btnSearchPrev) btnSearchPrev.addEventListener("click", prevSearchMatch);
}

function toggleSearchBar() {
  if (floatingSearchBar.style.display === "none" || !floatingSearchBar.style.display) {
    floatingSearchBar.style.display = "flex";
    docSearchInput.focus();
    docSearchInput.select();
    if (docSearchInput.value) performSearch(docSearchInput.value);
  } else {
    closeSearchBar();
  }
}

function closeSearchBar() {
  floatingSearchBar.style.display = "none";
  state.searchResults = [];
  state.currentSearchIndex = -1;
  renderSearchHighlights();
}

async function performSearch(query) {
  if (!state.docId || !query || !query.trim()) {
    state.searchResults = [];
    state.currentSearchIndex = -1;
    searchMatchCount.textContent = "0 of 0";
    renderSearchHighlights();
    return;
  }

  const queryTrim = query.trim();
  const lowerQuery = queryTrim.toLowerCase();

  // Instant 0ms local match preview on currently rendered page text blocks
  const localMatches = [];
  if (state.textBlocks && state.textBlocks.length > 0) {
    state.textBlocks.forEach(tb => {
      const text = (tb.text || "").toLowerCase();
      if (text.includes(lowerQuery)) {
        localMatches.push({
          page: state.currentPage,
          bbox: tb.bbox,
          text: tb.text
        });
      }
    });
  }
  if (localMatches.length > 0 && state.searchResults.length === 0) {
    state.searchResults = localMatches;
    state.currentSearchIndex = 0;
    updateSearchCounter();
    renderSearchHighlights();
  }

  try {
    const res = await fetch(`/api/document/${state.docId}/search?q=${encodeURIComponent(queryTrim)}`);
    if (!res.ok) return;
    const data = await res.json();
    state.searchResults = data.results || [];
    state.currentSearchIndex = state.searchResults.length > 0 ? 0 : -1;
    updateSearchCounter();
    renderSearchHighlights();

    // Jump to first match page if not on current page
    if (state.searchResults.length > 0) {
      const match = state.searchResults[0];
      if (match.page !== state.currentPage) {
        await loadPage(match.page);
      }
    }
  } catch (err) {
    console.error("Search error:", err);
  }
}

function updateSearchCounter() {
  if (state.searchResults.length === 0) {
    searchMatchCount.textContent = "0 of 0";
  } else {
    searchMatchCount.textContent = `${state.currentSearchIndex + 1} of ${state.searchResults.length}`;
  }
}

async function nextSearchMatch() {
  if (state.searchResults.length === 0) return;
  state.currentSearchIndex = (state.currentSearchIndex + 1) % state.searchResults.length;
  updateSearchCounter();
  const match = state.searchResults[state.currentSearchIndex];
  if (match.page !== state.currentPage) {
    await loadPage(match.page);
  } else {
    renderSearchHighlights();
  }
}

async function prevSearchMatch() {
  if (state.searchResults.length === 0) return;
  state.currentSearchIndex = (state.currentSearchIndex - 1 + state.searchResults.length) % state.searchResults.length;
  updateSearchCounter();
  const match = state.searchResults[state.currentSearchIndex];
  if (match.page !== state.currentPage) {
    await loadPage(match.page);
  } else {
    renderSearchHighlights();
  }
}

function renderSearchHighlights() {
  interactiveOverlay.querySelectorAll(".search-highlight-box").forEach(el => el.remove());
  if (state.searchResults.length === 0) return;

  const overlayRect = interactiveOverlay.getBoundingClientRect();
  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;

  state.searchResults.forEach((res, idx) => {
    if (res.page !== state.currentPage) return;
    const [x0, y0, x1, y1] = res.bbox;
    const div = document.createElement("div");
    div.className = "search-highlight-box";
    if (idx === state.currentSearchIndex) div.classList.add("active-match");
    div.style.left = `${x0 * scaleX}px`;
    div.style.top = `${y0 * scaleY}px`;
    div.style.width = `${(x1 - x0) * scaleX}px`;
    div.style.height = `${(y1 - y0) * scaleY}px`;
    interactiveOverlay.appendChild(div);
  });
}

// ==========================================================================
// Canvas Interaction & WYSIWYG
// ==========================================================================

function makeDraggable(elem, handle, onMoveEnd, onMove, onMoveStart) {
  if (!handle) handle = elem;
  handle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT" || e.target.isContentEditable) {
      return;
    }
    e.preventDefault();

    const overlay = document.getElementById("interactiveOverlay");
    const viewport = document.getElementById("canvasViewport");
    const startScrollTop = viewport ? viewport.scrollTop : 0;
    const startScrollLeft = viewport ? viewport.scrollLeft : 0;
    const overlayRect = overlay ? overlay.getBoundingClientRect() : { width: 595, height: 842 };

    const startMouseX = e.clientX;
    const startMouseY = e.clientY;
    const elemStartX = parseFloat(elem.style.left) || 0;
    const elemStartY = parseFloat(elem.style.top) || 0;
    const elemStartW = elem.offsetWidth;
    const elemStartH = elem.offsetHeight;
    let hasStartedMoving = false;

    let pendingRaf = null;
    let lastNewX = elemStartX;
    let lastNewY = elemStartY;

    function onMouseMove(moveEvent) {
      moveEvent.preventDefault();
      const currentScrollTop = viewport ? viewport.scrollTop : 0;
      const currentScrollLeft = viewport ? viewport.scrollLeft : 0;
      const dx = (moveEvent.clientX - startMouseX) + (currentScrollLeft - startScrollLeft);
      const dy = (moveEvent.clientY - startMouseY) + (currentScrollTop - startScrollTop);

      if (!hasStartedMoving && (Math.abs(dx) > 1 || Math.abs(dy) > 1)) {
        hasStartedMoving = true;
        if (onMoveStart) onMoveStart(elemStartX, elemStartY, elemStartW, elemStartH);
      }

      let newX = elemStartX + dx;
      let newY = elemStartY + dy;

      newX = Math.max(0, Math.min(newX, overlayRect.width - elemStartW));
      newY = Math.max(0, Math.min(newY, overlayRect.height - elemStartH));

      lastNewX = newX;
      lastNewY = newY;

      if (!pendingRaf) {
        pendingRaf = requestAnimationFrame(() => {
          pendingRaf = null;
          elem.style.left = `${lastNewX}px`;
          elem.style.top = `${lastNewY}px`;
          if (onMove) onMove(lastNewX, lastNewY, elemStartW, elemStartH);
        });
      }
    }

    function onMouseUp() {
      if (pendingRaf) {
        cancelAnimationFrame(pendingRaf);
        pendingRaf = null;
      }
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      elem.style.left = `${lastNewX}px`;
      elem.style.top = `${lastNewY}px`;

      if (onMoveEnd) {
        onMoveEnd(lastNewX, lastNewY, elemStartW, elemStartH, hasStartedMoving);
      }
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });
}

function makeResizable(elem, resizerOrOnEnd, onResize, handleDirs = ["nw", "ne", "se", "sw", "n", "s", "e", "w"]) {
  if (resizerOrOnEnd instanceof HTMLElement) {
    const handle = resizerOrOnEnd;
    const onResizeEnd = onResize;
    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const overlay = document.getElementById("interactiveOverlay");
      const overlayRect = overlay ? overlay.getBoundingClientRect() : { width: 595, height: 842 };

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const elemStartW = elem.offsetWidth;
      const elemStartH = elem.offsetHeight;
      const elemStartX = parseFloat(elem.style.left) || 0;
      const elemStartY = parseFloat(elem.style.top) || 0;

      let pendingRaf = null;
      let lastW = elemStartW;
      let lastH = elemStartH;

      function onMouseMove(moveEvent) {
        moveEvent.preventDefault();
        const dw = moveEvent.clientX - startMouseX;
        const dh = moveEvent.clientY - startMouseY;

        let newW = Math.max(24, elemStartW + dw);
        let newH = Math.max(18, elemStartH + dh);

        newW = Math.min(newW, overlayRect.width - elemStartX);
        newH = Math.min(newH, overlayRect.height - elemStartY);

        lastW = newW;
        lastH = newH;

        if (!pendingRaf) {
          pendingRaf = requestAnimationFrame(() => {
            pendingRaf = null;
            elem.style.width = `${lastW}px`;
            elem.style.height = `${lastH}px`;
          });
        }
      }

      function onMouseUp() {
        if (pendingRaf) {
          cancelAnimationFrame(pendingRaf);
          pendingRaf = null;
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        elem.style.width = `${lastW}px`;
        elem.style.height = `${lastH}px`;

        if (onResizeEnd) {
          onResizeEnd(elemStartX, elemStartY, lastW, lastH);
        }
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
    return;
  }

  const onResizeEnd = resizerOrOnEnd;
  handleDirs.forEach(dir => {
    const handle = document.createElement("div");
    handle.className = `transform-handle transform-handle-${dir}`;
    elem.appendChild(handle);

    handle.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const overlay = document.getElementById("interactiveOverlay");
      const overlayRect = overlay ? overlay.getBoundingClientRect() : { width: 595, height: 842 };

      const startMouseX = e.clientX;
      const startMouseY = e.clientY;
      const startL = parseFloat(elem.style.left) || 0;
      const startT = parseFloat(elem.style.top) || 0;
      const startW = elem.offsetWidth;
      const startH = elem.offsetHeight;

      let pendingRaf = null;
      let lastL = startL;
      let lastT = startT;
      let lastW = startW;
      let lastH = startH;

      function onMouseMove(me) {
        me.preventDefault();
        const dx = me.clientX - startMouseX;
        const dy = me.clientY - startMouseY;

        let newL = startL;
        let newT = startT;
        let newW = startW;
        let newH = startH;

        if (dir.includes("e")) {
          newW = Math.max(30, Math.min(startW + dx, overlayRect.width - startL));
        }
        if (dir.includes("s")) {
          newH = Math.max(20, Math.min(startH + dy, overlayRect.height - startT));
        }
        if (dir.includes("w")) {
          const maxDx = startW - 30;
          const actualDx = Math.min(maxDx, Math.max(-startL, dx));
          newL = startL + actualDx;
          newW = startW - actualDx;
        }
        if (dir.includes("n")) {
          const maxDy = startH - 20;
          const actualDy = Math.min(maxDy, Math.max(-startT, dy));
          newT = startT + actualDy;
          newH = startH - actualDy;
        }

        // Proportional aspect ratio constraint on corner handles
        const enforceRatio = (elem._isRatioLocked || me.shiftKey) && (dir.length === 2);
        if (enforceRatio) {
          const targetRatio = (elem._getAspectRatio && elem._getAspectRatio()) || ((startH > 0) ? (startW / startH) : 1);
          if (dir === "se" || dir === "nw") {
            if (Math.abs(dx) >= Math.abs(dy)) {
              newH = Math.max(20, Math.min(Math.round(newW / targetRatio), overlayRect.height - newT));
            } else {
              newW = Math.max(30, Math.min(Math.round(newH * targetRatio), overlayRect.width - newL));
            }
          } else if (dir === "ne" || dir === "sw") {
            if (Math.abs(dx) >= Math.abs(dy)) {
              newH = Math.max(20, Math.min(Math.round(newW / targetRatio), overlayRect.height - newT));
            } else {
              newW = Math.max(30, Math.min(Math.round(newH * targetRatio), overlayRect.width - newL));
            }
          }
        }

        lastL = newL;
        lastT = newT;
        lastW = newW;
        lastH = newH;

        if (!pendingRaf) {
          pendingRaf = requestAnimationFrame(() => {
            pendingRaf = null;
            elem.style.left = `${lastL}px`;
            elem.style.top = `${lastT}px`;
            elem.style.width = `${lastW}px`;
            elem.style.height = `${lastH}px`;
            if (onResize) onResize(lastL, lastT, lastW, lastH, dir);
          });
        }
      }

      function onMouseUp() {
        if (pendingRaf) {
          cancelAnimationFrame(pendingRaf);
          pendingRaf = null;
        }
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);

        elem.style.left = `${lastL}px`;
        elem.style.top = `${lastT}px`;
        elem.style.width = `${lastW}px`;
        elem.style.height = `${lastH}px`;

        if (onResizeEnd) {
          onResizeEnd(lastL, lastT, lastW, lastH, dir);
        }
      }

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    });
  });
}

function makeBoxDraggableAndSync(box, onSync) {
  let isBoxDragging = false;
  let startMouseX, startMouseY, startLeft, startTop, startW, startH;
  let pendingRaf = null;
  let lastLeft, lastTop;

  box.style.cursor = "move";
  box.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    isBoxDragging = true;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startLeft = parseFloat(box.style.left) || 0;
    startTop = parseFloat(box.style.top) || 0;
    startW = box.offsetWidth;
    startH = box.offsetHeight;
    lastLeft = startLeft;
    lastTop = startTop;

    const overlay = document.getElementById("interactiveOverlay");
    const overlayRect = overlay ? overlay.getBoundingClientRect() : { width: 595, height: 842 };

    function onMouseMove(me) {
      if (!isBoxDragging) return;
      me.preventDefault();
      const dx = me.clientX - startMouseX;
      const dy = me.clientY - startMouseY;
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      newLeft = Math.max(0, Math.min(newLeft, overlayRect.width - startW));
      newTop = Math.max(0, Math.min(newTop, overlayRect.height - startH));

      lastLeft = newLeft;
      lastTop = newTop;

      if (!pendingRaf) {
        pendingRaf = requestAnimationFrame(() => {
          pendingRaf = null;
          box.style.left = `${lastLeft}px`;
          box.style.top = `${lastTop}px`;
          if (onSync) onSync(lastLeft, lastTop, startW, startH);
        });
      }
    }

    function onMouseUp() {
      if (pendingRaf) {
        cancelAnimationFrame(pendingRaf);
        pendingRaf = null;
      }
      isBoxDragging = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);

      box.style.left = `${lastLeft}px`;
      box.style.top = `${lastTop}px`;
      if (onSync) onSync(lastLeft, lastTop, startW, startH);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  });
}

function setupCanvasDrawing() {
  let isDragging = false;
  let startX = 0, startY = 0;
  let activeBox = null;

  // Global click outside to deselect form field and active live transform box
  document.addEventListener("pointerdown", (e) => {
    if (
      !e.target.closest(".form-overlay-wrapper") &&
      !e.target.closest("#fieldInspectorCard") &&
      !e.target.closest("#formPaletteCard") &&
      !e.target.closest("#formFieldsContainer") &&
      !e.target.closest(".palette-field-btn") &&
      !e.target.closest(".btn-item-action")
    ) {
      deselectFormField();
    }

    if (activeTransformBox) {
      const isInsideTransform = e.target.closest(".live-transform-box");
      const isInsideSidebar = e.target.closest("#sidebar");
      const isInsideModal = e.target.closest(".modal") || e.target.closest("#confirmModal");
      const isInsideToast = e.target.closest(".toast");
      const isInsideContextMenu = e.target.closest(".custom-context-menu");
      const isTextBlock = e.target.closest(".text-block-highlight");
      const isImageOverlay = e.target.closest(".canvas-image-overlay");
      const isShapeOverlay = e.target.closest(".shape-annotation-wrapper");

      if (!isInsideTransform && !isInsideSidebar && !isInsideModal && !isInsideToast && !isInsideContextMenu && !isTextBlock && !isImageOverlay && !isShapeOverlay) {
        cancelTransformBox(false);
      }
    }
  });

  interactiveOverlay.addEventListener("mousedown", (e) => {
    // If clicking on canvas outside form overlays, deselect active form field
    if (!e.target.closest(".form-overlay-wrapper") && !e.target.closest("#fieldInspectorCard")) {
      deselectFormField();
    }

    // If clicking on canvas outside transform box, deselect active transform box
    if (activeTransformBox && !e.target.closest(".live-transform-box")) {
      cancelTransformBox(false);
    }

    // Guards to prevent canvas click from overriding interactive children
    if (
      e.target.closest(".text-block-highlight") ||
      e.target.closest(".canvas-image-overlay") ||
      e.target.closest(".shape-annotation-wrapper") ||
      e.target.closest(".form-overlay-widget") ||
      e.target.closest(".live-transform-box") ||
      e.target.closest(".wysiwyg-text-box") ||
      e.target.closest(".interactive-image-box") ||
      e.target.closest(".form-overlay-wrapper") ||
      e.target.closest(".pdf-wysiwyg-container") ||
      e.target.closest(".wysiwyg-toolbar")
    ) return;

    // Sticky note placement handler
    if (state.activeStickyNotePlacement) {
      handleStickyNotePlacement(e);
      return;
    }

    // Stamp placement handler
    if (state.activeTab === "tab-annotate" && state.activeStamp) {
      handleStampPlacement(e);
      return;
    }

    // Form field placement handler
    if (state.formPlacementType) {
      handleFormPlacement(e);
      return;
    }

    // Measurement tool handler
    if (state.measureMode && (state.activeTab !== "tab-shapes" || state.shapesSubMode === "ruler")) {
      const rect = interactiveOverlay.getBoundingClientRect();
      const scaleX = state.pageWidthPt / rect.width;
      const scaleY = state.pageHeightPt / rect.height;
      const ptX = (e.clientX - rect.left) * scaleX;
      const ptY = (e.clientY - rect.top) * scaleY;
      handleMeasurementClick({ x: ptX, y: ptY });
      return;
    }

    // Direct Click-to-Type Live Text Box placement
    if (state.activeTab === "tab-add") {
      const rect = interactiveOverlay.getBoundingClientRect();
      initLiveTextTransformBox({
        mode: "add",
        leftPx: e.clientX - rect.left,
        topPx: e.clientY - rect.top,
        widthPx: 220,
        heightPx: 48,
        text: "",
        fontSize: parseFloat(document.getElementById("newTextFontSize")?.value) || 14,
        textColor: document.getElementById("newTextColor")?.value || "#000000",
        fontName: document.getElementById("newTextFont")?.value || "helv"
      });
      return;
    }

    const validTabs = ["tab-shapes", "tab-redact", "tab-forms", "tab-image", "tab-organize"];
    if (!validTabs.includes(state.activeTab)) return;

    isDragging = true;
    const rect = interactiveOverlay.getBoundingClientRect();
    const scaleX = state.pageWidthPt / rect.width;
    const scaleY = state.pageHeightPt / rect.height;

    startX = (e.clientX - rect.left) * scaleX;
    startY = (e.clientY - rect.top) * scaleY;

    if (activeBox) activeBox.remove();
    activeBox = document.createElement("div");
    activeBox.className = state.activeTab === "tab-redact" ? "redact-preview-box" : "shape-preview-box";
    activeBox.style.left = `${e.clientX - rect.left}px`;
    activeBox.style.top = `${e.clientY - rect.top}px`;
    activeBox.style.width = "0px";
    activeBox.style.height = "0px";
    interactiveOverlay.appendChild(activeBox);
  });

  interactiveOverlay.addEventListener("mousemove", (e) => {
    if (!isDragging || !activeBox) return;
    const rect = interactiveOverlay.getBoundingClientRect();
    const currentX = (e.clientX - rect.left);
    const currentY = (e.clientY - rect.top);

    const scaleX = state.pageWidthPt / rect.width;
    const scaleY = state.pageHeightPt / rect.height;
    const startXpx = startX / scaleX;
    const startYpx = startY / scaleY;

    const left = Math.min(startXpx, currentX);
    const top = Math.min(startYpx, currentY);
    const width = Math.abs(currentX - startXpx);
    const height = Math.abs(currentY - startYpx);

    activeBox.style.left = `${left}px`;
    activeBox.style.top = `${top}px`;
    activeBox.style.width = `${width}px`;
    activeBox.style.height = `${height}px`;
  });

  interactiveOverlay.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    isDragging = false;

    const rect = interactiveOverlay.getBoundingClientRect();
    const scaleX = state.pageWidthPt / rect.width;
    const scaleY = state.pageHeightPt / rect.height;
    const endX = (e.clientX - rect.left) * scaleX;
    const endY = (e.clientY - rect.top) * scaleY;

    const minX = Math.round(Math.min(startX, endX));
    const minY = Math.round(Math.min(startY, endY));
    const maxX = Math.round(Math.max(startX, endX));
    const maxY = Math.round(Math.max(startY, endY));
    const w = maxX - minX;
    const h = maxY - minY;

    if (state.activeTab === "tab-shapes") {
      document.getElementById("shapeStartX").value = minX;
      document.getElementById("shapeStartY").value = minY;
      document.getElementById("shapeEndX").value = maxX;
      document.getElementById("shapeEndY").value = maxY;

      if (state.shapesSubMode === "shapes") {
        if (activeBox) {
          activeBox.remove();
          activeBox = null;
        }
        const shapeType = document.getElementById("shapeType")?.value || "rect";
        const strokeColor = document.getElementById("shapeColor")?.value || "#2563eb";
        const fillColorVal = document.getElementById("shapeFill")?.value || "#ffffff";
        const fillColor = fillColorVal === "#ffffff" ? null : fillColorVal;
        const strokeWidth = parseFloat(document.getElementById("shapeWidth")?.value) || 2;

        let lPx = minX / scaleX;
        let tPx = minY / scaleY;
        let wPx = w / scaleX;
        let hPx = h / scaleY;

        if (wPx < 15 || hPx < 15) {
          wPx = 180;
          hPx = 120;
          lPx = Math.max(10, Math.min((e.clientX - rect.left) - 90, rect.width - wPx - 10));
          tPx = Math.max(10, Math.min((e.clientY - rect.top) - 60, rect.height - hPx - 10));
        }

        if (typeof initLiveShapeTransformBox === "function") {
          initLiveShapeTransformBox({
            mode: "insert",
            shapeType: shapeType,
            strokeColor: strokeColor,
            fillColor: fillColor,
            strokeWidth: strokeWidth,
            leftPx: lPx,
            topPx: tPx,
            widthPx: wPx,
            heightPx: hPx
          });
          return;
        }
      }
    } else if (state.activeTab === "tab-forms") {
      document.getElementById("formX0").value = minX;
      document.getElementById("formY0").value = minY;
      document.getElementById("formX1").value = maxX;
      document.getElementById("formY1").value = maxY;
    } else if (state.activeTab === "tab-image") {
      document.getElementById("imgX0").value = minX;
      document.getElementById("imgY0").value = minY;
      document.getElementById("imgX1").value = maxX;
      document.getElementById("imgY1").value = maxY;
    } else if (state.activeTab === "tab-organize" && state.isVisualCropping) {
      const pW = state.pageWidthPt || 595;
      const pH = state.pageHeightPt || 842;
      document.getElementById("cropMarginLeft").value = minX;
      document.getElementById("cropMarginTop").value = minY;
      document.getElementById("cropMarginRight").value = Math.max(0, pW - maxX);
      document.getElementById("cropMarginBottom").value = Math.max(0, pH - maxY);
      state.cropCoordsPt = [minX, minY, maxX, maxY];
      if (activeBox) {
        activeBox.remove();
        activeBox = null;
      }
      renderVisualCropBox();
      showToast(`Crop box set: [${minX}, ${minY}, ${maxX}, ${maxY}]`, "info");
      return;
    }

    // Make drawn placement box movable on the canvas before action
    if (activeBox && activeBox.offsetWidth > 10 && activeBox.offsetHeight > 10) {
      makeBoxDraggableAndSync(activeBox, (newLeft, newTop, wPx, hPx) => {
        const oRect = interactiveOverlay.getBoundingClientRect();
        const sX = state.pageWidthPt / oRect.width;
        const sY = state.pageHeightPt / oRect.height;
        const curMinX = Math.round(newLeft * sX);
        const curMinY = Math.round(newTop * sY);
        const curMaxX = Math.round((newLeft + wPx) * sX);
        const curMaxY = Math.round((newTop + hPx) * sY);

        if (state.activeTab === "tab-shapes") {
          document.getElementById("shapeStartX").value = curMinX;
          document.getElementById("shapeStartY").value = curMinY;
          document.getElementById("shapeEndX").value = curMaxX;
          document.getElementById("shapeEndY").value = curMaxY;
        } else if (state.activeTab === "tab-forms") {
          document.getElementById("formX0").value = curMinX;
          document.getElementById("formY0").value = curMinY;
          document.getElementById("formX1").value = curMaxX;
          document.getElementById("formY1").value = curMaxY;
        } else if (state.activeTab === "tab-image") {
          document.getElementById("imgX0").value = curMinX;
          document.getElementById("imgY0").value = curMinY;
          document.getElementById("imgX1").value = curMaxX;
          document.getElementById("imgY1").value = curMaxY;
        }
      });
    }
  });

  // Direct Canvas Drag & Drop for Image Files
  if (pageCanvasWrapper) {
    pageCanvasWrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes("Files")) {
        pageCanvasWrapper.classList.add("canvas-drag-active");
      }
    });

    pageCanvasWrapper.addEventListener("dragleave", (e) => {
      if (!pageCanvasWrapper.contains(e.relatedTarget)) {
        pageCanvasWrapper.classList.remove("canvas-drag-active");
      }
    });

    pageCanvasWrapper.addEventListener("drop", (e) => {
      e.preventDefault();
      pageCanvasWrapper.classList.remove("canvas-drag-active");
      if (!state.docId) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        if (file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp|tiff|svg)$/i.test(file.name)) {
          const overlay = document.getElementById("interactiveOverlay");
          const overlayRect = overlay.getBoundingClientRect();
          const dropLeftPx = Math.max(10, Math.min(e.clientX - overlayRect.left, overlayRect.width - 160));
          const dropTopPx = Math.max(10, Math.min(e.clientY - overlayRect.top, overlayRect.height - 120));

          handleImageFileForPlacement(file, dropLeftPx, dropTopPx);
        }
      }
    });
  }

  // Global Clipboard Image Paste (Ctrl+V)
  window.addEventListener("paste", (e) => {
    if (!state.docId) return;
    // Don't intercept if user is typing text into an input or textarea
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      if (!activeEl.classList.contains("transform-text-editor")) return;
    }

    if (e.clipboardData && e.clipboardData.items) {
      for (const item of e.clipboardData.items) {
        if (item.type && item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            handleImageFileForPlacement(file);
            showToast("Pasted image from clipboard ready to place!", "info");
            return;
          }
        }
      }
    }
  });

  setupFreehandCanvas();
}

// ==========================================================================
// Universal Live Canvas Transform Engine (Text, Images, Annotations)
// ==========================================================================

function cancelTransformBox(keepMasks = false) {
  if (activeTransformBox) {
    if (activeTransformBox._cleanup) {
      try { activeTransformBox._cleanup(); } catch (e) {}
    }
    activeTransformBox.remove();
    activeTransformBox = null;
  }
  const newTxt = document.getElementById("newTextContent");
  if (newTxt) newTxt.value = "";
  if (blockEditorContainer) blockEditorContainer.style.display = "none";
  state.selectedBlock = null;
  if (!keepMasks) {
    interactiveOverlay.querySelectorAll(".element-underlying-mask").forEach(el => el.remove());
    interactiveOverlay.querySelectorAll(".canvas-image-overlay").forEach(el => {
      el.style.display = "";
      el.classList.remove("is-dragging");
    });
    interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(el => {
      el.style.display = "";
      el.classList.remove("selected");
      el.classList.remove("is-dragging");
    });
    interactiveOverlay.querySelectorAll(".shape-annotation-wrapper").forEach(el => {
      el.style.display = "";
      el.classList.remove("selected");
      el.classList.remove("is-dragging");
    });
  }
}

async function executeLayerOrder({ page, elementType, action, elementId, bbox, text, fontSize, fontName, color }) {
  setLoading(true, `Updating layer depth (${action.replace(/_/g, " ")})...`);
  try {
    const res = await fetch(`/api/document/${state.docId}/layer-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: page || state.currentPage,
        element_type: elementType,
        action: action,
        element_id: elementId,
        bbox: bbox,
        text: text,
        font_size: fontSize,
        font_name: fontName,
        color: color
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to reorder layer");
    }
    const data = await res.json();
    showToast(data.message || "Layer order updated successfully!", "success");
    if (activeTransformBox) {
      activeTransformBox.remove();
      activeTransformBox = null;
    }
    await applyMutationResponse(data, state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

function initLiveTextTransformBox(options = {}) {
  cancelTransformBox();

  const mode = options.mode || "add"; // "add" | "edit"
  const overlay = document.getElementById("interactiveOverlay");
  const overlayRect = overlay.getBoundingClientRect();
  const scaleX = state.pageWidthPt / overlayRect.width;
  const scaleY = state.pageHeightPt / overlayRect.height;

  let currentText = options.text || "";
  let currentFontSize = options.fontSize || 14;
  let currentFontName = options.fontName || "helv";
  let currentColor = options.textColor || "#000000";
  let currentBold = Boolean(options.isBold);
  let currentItalic = Boolean(options.isItalic);
  let currentAlign = options.align !== undefined ? options.align : 0; // 0=left, 1=center, 2=right

  // Recommended Default: Auto-height + automatic word wrapping enabled by default
  let isAutoHeight = options.isAutoHeight !== undefined ? Boolean(options.isAutoHeight) : true;
  let hasOverflow = false;

  const fontSizePx = Math.max(12, currentFontSize * (1.0 / scaleY));
  const textLines = (currentText || "").split("\n").length;

  let leftPx = options.leftPx !== undefined ? options.leftPx : 40;
  let topPx = options.topPx !== undefined ? options.topPx : 40;
  let widthPx = options.widthPx || Math.max(220, (currentText.length * fontSizePx * 0.6) + 30);
  let heightPx = options.heightPx || Math.max(42, fontSizePx * 1.35 * textLines + 12);
  const initialMinH = Math.max(36, fontSizePx * 1.35 + 8);

  if (mode === "edit" && options.origBlock) {
    // 1. Hide the corresponding text block highlight overlay
    interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(el => {
      if (options.divElement === el || el.dataset.blockId === String(options.origBlock.id)) {
        el.style.display = "none";
      }
    });

    // 2. Add an underlying backdrop mask to cleanly conceal the original text on the background PDF
    const underlyingMask = document.createElement("div");
    underlyingMask.className = "element-underlying-mask text-underlying-mask";
    underlyingMask.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
    underlyingMask.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
    underlyingMask.style.width = `${widthPx}px`;
    underlyingMask.style.height = `${heightPx}px`;
    interactiveOverlay.appendChild(underlyingMask);
  }

  const box = document.createElement("div");
  box.className = `live-transform-box mode-${mode === "edit" ? "edit-text" : "add-text"}`;
  box.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
  box.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
  box.style.width = `${widthPx}px`;
  box.style.height = `${heightPx}px`;

  // Stop propagation
  box.addEventListener("mousedown", (e) => e.stopPropagation());
  box.addEventListener("click", (e) => e.stopPropagation());

  // 1. Sleek Floating Top Pill (Outside the box so interior is 100% textarea)
  const pill = document.createElement("div");
  pill.className = "transform-top-pill";
  pill.innerHTML = `
    <span class="pill-title">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
      <span>${mode === "edit" ? "Edit Text" : "New Text"}</span>
    </span>
    <span class="pill-badge live-coord-badge"></span>
    <span class="pill-close" title="Cancel (Esc)">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>
  `;
  box.appendChild(pill);
  pill.querySelector(".pill-close").addEventListener("click", () => cancelTransformBox(false));

  // 3. Floating Micro-Toolbar (Created early so position helper can reference it)
  const toolbar = document.createElement("div");
  toolbar.className = "transform-floating-toolbar";

  function updateToolbarPosition() {
    if (!toolbar || !box) return;

    const viewportEl = document.getElementById("canvasViewport");
    const viewportRect = viewportEl ? viewportEl.getBoundingClientRect() : {
      left: 0,
      right: window.innerWidth,
      top: 0,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight
    };
    const boxRect = box.getBoundingClientRect();

    // Accurately measure toolbar dimensions
    const tbRect = toolbar.getBoundingClientRect();
    const tbWidth = tbRect.width > 0 ? tbRect.width : (toolbar.offsetWidth || 480);
    const tbHeight = tbRect.height > 0 ? tbRect.height : (toolbar.offsetHeight || 32);

    // 1. Vertical positioning (Above vs Below)
    const spaceAbove = boxRect.top - Math.max(viewportRect.top, 0) - 8;
    const spaceBelow = Math.min(viewportRect.bottom, window.innerHeight) - boxRect.bottom - 8;

    if (spaceAbove < (tbHeight + 35) && spaceBelow >= (tbHeight + 15)) {
      toolbar.classList.add("toolbar-below");
    } else if (spaceBelow < (tbHeight + 15) && spaceAbove >= (tbHeight + 35)) {
      toolbar.classList.remove("toolbar-below");
    } else if (spaceAbove < (tbHeight + 35)) {
      toolbar.classList.add("toolbar-below");
    } else {
      toolbar.classList.remove("toolbar-below");
    }

    // 2. Horizontal clamping: Strictly constrain toolbar within visible viewport margins
    const padding = 8;
    const availWidth = Math.max(260, viewportRect.width - padding * 2);
    const effectiveTbWidth = Math.min(tbWidth, availWidth);

    const screenMinX = viewportRect.left + padding;
    const screenMaxX = viewportRect.right - padding - effectiveTbWidth;

    const idealCenter = boxRect.left + (boxRect.width / 2);
    const idealScreenLeft = idealCenter - (effectiveTbWidth / 2);

    let clampedScreenLeft;
    if (screenMaxX <= screenMinX) {
      clampedScreenLeft = screenMinX;
    } else {
      clampedScreenLeft = Math.max(screenMinX, Math.min(idealScreenLeft, screenMaxX));
    }

    const relLeft = clampedScreenLeft - boxRect.left;
    toolbar.style.left = `${Math.round(relLeft)}px`;
    toolbar.style.transform = "none";
    toolbar.style.right = "auto";
    toolbar.style.maxWidth = `${Math.floor(availWidth)}px`;

    // 3. Keep pill within horizontal viewport bounds as well
    if (pill) {
      const pillRect = pill.getBoundingClientRect();
      const pillWidth = pillRect.width > 0 ? pillRect.width : (pill.offsetWidth || 220);
      const idealPillScreenLeft = boxRect.left;
      const pillMaxX = Math.min(viewportRect.right - padding, window.innerWidth - padding) - pillWidth;
      const pillMinX = Math.max(viewportRect.left + padding, padding);
      let clampedPillScreenLeft = idealPillScreenLeft;
      if (pillMaxX >= pillMinX) {
        clampedPillScreenLeft = Math.max(pillMinX, Math.min(idealPillScreenLeft, pillMaxX));
      }
      const relPillLeft = clampedPillScreenLeft - boxRect.left;
      pill.style.left = `${Math.round(relPillLeft)}px`;
      pill.style.maxWidth = `${Math.floor(availWidth)}px`;
    }
  }

  function updateCoordBadge() {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;
    const ptX = Math.round(curL * scaleX);
    const ptY = Math.round(curT * scaleY);
    const ptW = Math.round(curW * scaleX);
    const ptH = Math.round(curH * scaleY);
    const badge = pill.querySelector(".live-coord-badge");
    if (badge) {
      if (hasOverflow) {
        badge.className = "pill-badge overflow-warning";
        badge.textContent = `+Overflow (Click to Auto-Fit)`;
        badge.title = "Content exceeds fixed height! Click to expand height to fit all content.";
      } else {
        badge.className = "pill-badge live-coord-badge";
        badge.textContent = `${ptW}×${ptH}pt @ (${ptX},${ptY}) ${isAutoHeight ? '• Auto-Fit' : '• Fixed'}`;
        badge.title = isAutoHeight ? "Auto-height active: Box expands vertically as you type or wrap" : "Fixed height mode: Content scrolls when exceeded";
      }
    }
    const autoBtn = toolbar.querySelector(".tb-auto-height-btn");
    if (autoBtn) {
      autoBtn.classList.toggle("active", isAutoHeight);
      autoBtn.querySelector("span").textContent = isAutoHeight ? "Auto-Fit" : "Fixed";
      autoBtn.title = isAutoHeight ? "Auto-Height is ON (Click for Fixed Height)" : "Fixed Height is ON (Click to Auto-Fit)";
    }
    updateToolbarPosition();
  }

  // Clicking badge when overflow exists auto-fits height
  pill.querySelector(".live-coord-badge").addEventListener("click", () => {
    if (hasOverflow || !isAutoHeight) {
      isAutoHeight = true;
      autoFitTextarea(true);
    }
  });

  // 2. Editor Body & Input (100% full height of box)
  const body = document.createElement("div");
  body.className = "transform-editor-body";

  const textarea = document.createElement("textarea");
  textarea.className = "transform-text-editor";
  textarea.placeholder = "Click and type text here...";
  textarea.value = currentText;

  function autoFitTextarea(forceExpand = false) {
    if (isAutoHeight || forceExpand) {
      textarea.style.height = "1px";
      const effFontSizePx = Math.max(10, currentFontSize * (1.0 / scaleY));
      const minH = Math.max(initialMinH, effFontSizePx * 1.35 + 8);
      const neededH = Math.max(minH, textarea.scrollHeight + 6);
      
      const curT = parseFloat(box.style.top) || 0;
      const maxAllowedH = Math.max(minH, overlayRect.height - curT - 10);
      const finalH = Math.min(neededH, maxAllowedH);

      box.style.height = `${finalH}px`;
      textarea.style.height = "100%";
      const isExceeded = textarea.scrollHeight > textarea.clientHeight + 2;
      hasOverflow = isExceeded;
      textarea.style.overflowX = "hidden";
      textarea.style.overflowY = "auto";
      if (forceExpand) isAutoHeight = true;
    } else {
      textarea.style.height = "100%";
      const isExceeded = textarea.scrollHeight > textarea.clientHeight + 2;
      hasOverflow = isExceeded;
      textarea.style.overflowX = "hidden";
      textarea.style.overflowY = "auto";
    }
    updateCoordBadge();
  }

  function syncTextareaStyles() {
    const effFontSizePx = Math.max(10, currentFontSize * (1.0 / scaleY));
    textarea.style.fontSize = `${effFontSizePx}px`;
    textarea.style.color = currentColor;
    textarea.style.fontWeight = currentBold ? "bold" : "normal";
    textarea.style.fontStyle = currentItalic ? "italic" : "normal";
    textarea.style.textAlign = currentAlign === 1 ? "center" : (currentAlign === 2 ? "right" : "left");
    if (currentFontName.includes("times") || currentFontName.includes("serif") || currentFontName.includes("ti")) {
      textarea.style.fontFamily = "Times New Roman, serif";
    } else if (currentFontName.includes("couri") || currentFontName.includes("mono") || currentFontName.includes("cour") || currentFontName.includes("co")) {
      textarea.style.fontFamily = "Courier New, monospace";
    } else {
      textarea.style.fontFamily = "Helvetica, Arial, sans-serif";
    }
    autoFitTextarea();
  }
  syncTextareaStyles();

  let hasMoved = false;
  let hasResized = false;

  textarea.addEventListener("mousedown", (e) => e.stopPropagation());
  textarea.addEventListener("click", (e) => e.stopPropagation());
  textarea.addEventListener("wheel", (e) => {
    e.stopPropagation();
  }, { passive: true });
  textarea.addEventListener("input", (e) => {
    currentText = e.target.value;
    autoFitTextarea();
    if (mode === "edit" && blockEditText) {
      blockEditText.value = currentText;
    } else if (mode === "add") {
      const sbInput = document.getElementById("newTextContent");
      if (sbInput) sbInput.value = currentText;
    }
  });

  textarea.addEventListener("paste", () => {
    setTimeout(() => {
      currentText = textarea.value;
      autoFitTextarea(isAutoHeight);
    }, 10);
  });

  textarea.addEventListener("keydown", (e) => {
    e.stopPropagation();
    if (e.key === "Escape") {
      cancelTransformBox();
    } else if (e.key === "Enter" && e.ctrlKey) {
      commitAction();
    }
  });

  body.appendChild(textarea);
  box.appendChild(body);

  toolbar.innerHTML = `
    <div class="tb-group tb-formatting-group">
      <select class="tb-font-select" title="Font Family">
        <option value="helv" ${currentFontName === 'helv' ? 'selected' : ''}>Helvetica</option>
        <option value="times" ${currentFontName === 'times' ? 'selected' : ''}>Times</option>
        <option value="couri" ${currentFontName === 'couri' ? 'selected' : ''}>Courier</option>
      </select>
      <button type="button" class="size-stepper-btn tb-size-dec" title="Decrease Font Size">-</button>
      <input type="number" class="tb-size-input" value="${Math.round(currentFontSize)}" min="6" max="96" style="width: 28px; text-align: center;" />
      <button type="button" class="size-stepper-btn tb-size-inc" title="Increase Font Size">+</button>
      <div class="tb-divider"></div>
      <input type="color" class="tb-color-input" value="${currentColor}" title="Text Color" />
      <button type="button" class="tool-btn tb-bold-btn ${currentBold ? 'active' : ''}" title="Bold">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>
      </button>
      <button type="button" class="tool-btn tb-italic-btn ${currentItalic ? 'active' : ''}" title="Italic">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
      </button>
      <div class="tb-divider"></div>
      <button type="button" class="tool-btn tb-align-btn ${currentAlign === 0 ? 'active' : ''}" data-align="0" title="Align Left">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="15" y1="12" x2="3" y2="12"/><line x1="17" y1="18" x2="3" y2="18"/></svg>
      </button>
      <button type="button" class="tool-btn tb-align-btn ${currentAlign === 1 ? 'active' : ''}" data-align="1" title="Align Center">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="19" y1="12" x2="5" y2="12"/><line x1="21" y1="18" x2="3" y2="18"/></svg>
      </button>
      <button type="button" class="tool-btn tb-align-btn ${currentAlign === 2 ? 'active' : ''}" data-align="2" title="Align Right">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="12" x2="9" y2="12"/><line x1="21" y1="18" x2="7" y2="18"/></svg>
      </button>
      <div class="tb-divider"></div>
      <button type="button" class="tool-btn tb-auto-height-btn ${isAutoHeight ? 'active' : ''}" title="Toggle Auto-Height / Fit to Content">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="7 15 12 20 17 15"/><polyline points="7 9 12 4 17 9"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
        <span>${isAutoHeight ? 'Auto-Fit' : 'Fixed'}</span>
      </button>
      <div class="tb-divider"></div>
      <div class="tb-dropdown-wrap layer-dropdown-wrap">
        <button type="button" class="tool-btn tb-layer-btn" title="Layer Depth / Stacking (Z-Index)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <span>Layer</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="layer-dropdown-menu">
          <button type="button" class="layer-item" data-action="bring_to_front" title="Bring to Front (Ctrl + ])">
            <span class="layer-icon">⤊</span>
            <span class="layer-title">Bring to Front</span>
            <span class="layer-shortcut">Ctrl+]</span>
          </button>
          <button type="button" class="layer-item" data-action="bring_forward" title="Bring Forward (Alt + ])">
            <span class="layer-icon">⇡</span>
            <span class="layer-title">Bring Forward</span>
            <span class="layer-shortcut">Alt+]</span>
          </button>
          <button type="button" class="layer-item" data-action="send_backward" title="Send Backward (Alt + [)">
            <span class="layer-icon">⇣</span>
            <span class="layer-title">Send Backward</span>
            <span class="layer-shortcut">Alt+[</span>
          </button>
          <button type="button" class="layer-item" data-action="send_to_back" title="Send to Back (Ctrl + [)">
            <span class="layer-icon">⤋</span>
            <span class="layer-title">Send to Back</span>
            <span class="layer-shortcut">Ctrl+[</span>
          </button>
        </div>
      </div>
    </div>
    <div class="tb-divider action-divider"></div>
    <div class="tb-group tb-actions-group">
      <button type="button" class="tool-btn btn-save" title="Apply / Save Text (Ctrl+Enter)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${mode === 'edit' ? 'Save' : 'Apply'}</span>
      </button>
      ${mode === 'edit' ? '<button type="button" class="tool-btn btn-delete" title="Delete Text"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>' : ''}
      <button type="button" class="tool-btn tb-cancel-btn" title="Cancel (Esc)">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Cancel</span>
      </button>
    </div>
  `;
  box.appendChild(toolbar);

  // Attach toolbar listeners
  toolbar.querySelectorAll(".layer-dropdown-menu .layer-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      triggerTextLayer(action);
    });
  });

  const btnAutoHeight = toolbar.querySelector(".tb-auto-height-btn");
  if (btnAutoHeight) {
    btnAutoHeight.addEventListener("click", () => {
      isAutoHeight = !isAutoHeight;
      if (isAutoHeight) {
        autoFitTextarea(true);
      } else {
        autoFitTextarea(false);
      }
      updateCoordBadge();
    });
  }

  function triggerTextLayer(action) {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;
    const ptX0 = Math.round(curL * scaleX);
    const ptY0 = Math.round(curT * scaleY);
    const ptX1 = Math.round(ptX0 + curW * scaleX);
    const ptY1 = Math.round(ptY0 + curH * scaleY);
    const rgbCol = hexToRgb(currentColor);

    executeLayerOrder({
      page: state.currentPage,
      elementType: "text",
      action: action,
      bbox: [ptX0, ptY0, ptX1, ptY1],
      text: textarea.value || currentText,
      fontSize: currentFontSize,
      fontName: currentFontName,
      color: rgbCol
    });
  }

  box._triggerLayer = triggerTextLayer;
  const selFont = toolbar.querySelector(".tb-font-select");
  const inSize = toolbar.querySelector(".tb-size-input");
  const btnDec = toolbar.querySelector(".tb-size-dec");
  const btnInc = toolbar.querySelector(".tb-size-inc");
  const inColor = toolbar.querySelector(".tb-color-input");
  const btnB = toolbar.querySelector(".tb-bold-btn");
  const btnI = toolbar.querySelector(".tb-italic-btn");
  const btnSave = toolbar.querySelector(".btn-save");
  const btnDel = toolbar.querySelector(".btn-delete");
  const btnCancel = toolbar.querySelector(".tb-cancel-btn");

  selFont.addEventListener("change", (e) => {
    currentFontName = e.target.value;
    if (blockEditFont) blockEditFont.value = currentFontName;
    syncTextareaStyles();
  });
  inSize.addEventListener("input", (e) => {
    currentFontSize = parseFloat(e.target.value) || 12;
    if (blockEditSize) blockEditSize.value = currentFontSize;
    syncTextareaStyles();
  });
  btnDec.addEventListener("click", () => {
    currentFontSize = Math.max(6, currentFontSize - 1);
    inSize.value = Math.round(currentFontSize);
    if (blockEditSize) blockEditSize.value = currentFontSize;
    syncTextareaStyles();
  });
  btnInc.addEventListener("click", () => {
    currentFontSize = Math.min(120, currentFontSize + 1);
    inSize.value = Math.round(currentFontSize);
    if (blockEditSize) blockEditSize.value = currentFontSize;
    syncTextareaStyles();
  });
  inColor.addEventListener("input", (e) => {
    currentColor = e.target.value;
    if (blockEditColor) blockEditColor.value = currentColor;
    syncTextareaStyles();
  });
  btnB.addEventListener("click", () => {
    currentBold = !currentBold;
    btnB.classList.toggle("active", currentBold);
    if (btnBlockBold) btnBlockBold.classList.toggle("active", currentBold);
    syncTextareaStyles();
  });
  btnI.addEventListener("click", () => {
    currentItalic = !currentItalic;
    btnI.classList.toggle("active", currentItalic);
    if (btnBlockItalic) btnBlockItalic.classList.toggle("active", currentItalic);
    syncTextareaStyles();
  });

  toolbar.querySelectorAll(".tb-align-btn").forEach(b => {
    b.addEventListener("click", () => {
      currentAlign = parseInt(b.dataset.align) || 0;
      toolbar.querySelectorAll(".tb-align-btn").forEach(btn => btn.classList.remove("active"));
      b.classList.add("active");
      if (blockEditAlign) blockEditAlign.value = String(currentAlign);
      syncTextareaStyles();
    });
  });

  btnCancel.addEventListener("click", () => cancelTransformBox(false));

  // 4. Save / Commit Action
  async function commitAction() {
    const textVal = textarea.value.trim();
    if (!textVal && mode === "add") {
      cancelTransformBox();
      return;
    }

    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;

    const ptX0 = Math.round(curL * scaleX);
    const ptY0 = Math.round(curT * scaleY);
    const ptX1 = Math.round(ptX0 + curW * scaleX);
    const ptY1 = Math.round(ptY0 + curH * scaleY);
    const newBbox = [ptX0, ptY0, ptX1, ptY1];

    const rgbCol = hexToRgb(currentColor);

    cancelTransformBox();
    setLoading(true, mode === "edit" ? "Updating text in PDF..." : "Placing new text on PDF...");

    try {
      let mutationData = null;
      if (mode === "add") {
        const hasBox = document.getElementById("newTextWithBox")?.checked;
        const bgCol = hasBox ? hexToRgb(document.getElementById("newTextBgColor")?.value || "#ffffff") : null;
        const res = await fetch(`/api/document/${state.docId}/add-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            annotations: [{
              page: state.currentPage,
              x: ptX0,
              y: ptY0,
              width: ptX1 - ptX0,
              height: ptY1 - ptY0,
              text: textVal,
              font_size: currentFontSize,
              font_name: currentFontName,
              color: rgbCol,
              bg_color: bgCol
            }]
          })
        });
        if (!res.ok) throw new Error("Failed to add text");
        mutationData = await res.json();
        const sbInput = document.getElementById("newTextContent");
        if (sbInput) sbInput.value = "";
        showToast("Text added successfully!", "success");
      } else {
        // Edit existing text block
        const origText = (options.origBlock ? options.origBlock.text : options.text) || "";
        const origFontSize = options.origBlock ? (options.origBlock.avg_font_size || options.origBlock.font_size || options.fontSize) : options.fontSize;
        const origFontName = options.fontName || "helv";
        const origAlign = options.align !== undefined ? options.align : 0;
        const origColor = options.textColor || "#000000";

        if (!hasMoved && !hasResized &&
            textVal === origText.trim() &&
            currentFontSize === (origFontSize || 14) &&
            currentFontName === origFontName &&
            currentColor === origColor &&
            currentBold === Boolean(options.isBold) &&
            currentItalic === Boolean(options.isItalic) &&
            currentAlign === origAlign) {
          setLoading(false);
          return;
        }

        const origBbox = options.origBlock ? options.origBlock.bbox : newBbox;
        const targetNewBbox = (hasMoved || hasResized) ? newBbox : null;
        const res = await fetch(`/api/document/${state.docId}/edit-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            edits: [{
              page: state.currentPage,
              bbox: origBbox,
              lines: options.origBlock?.lines,
              new_bbox: targetNewBbox,
              new_text: textVal,
              font_size: currentFontSize,
              font_name: currentFontName,
              is_bold: currentBold,
              is_italic: currentItalic,
              align: currentAlign,
              text_color: rgbCol,
              bg_color: null
            }]
          })
        });
        if (!res.ok) throw new Error("Failed to edit text block");
        mutationData = await res.json();
        showToast("Text block updated successfully!", "success");
      }

      await applyMutationResponse(mutationData, state.currentPage);

      // Auto-highlight newly placed or updated text block on canvas
      setTimeout(() => {
        const matchingEl = Array.from(interactiveOverlay.querySelectorAll(".text-block-highlight")).find(el => {
          const l = parseFloat(el.style.left) || 0;
          const t = parseFloat(el.style.top) || 0;
          return Math.abs(l - curL) < 25 && Math.abs(t - curT) < 25;
        });
        if (matchingEl) {
          matchingEl.classList.add("recently-placed");
          setTimeout(() => matchingEl.classList.remove("recently-placed"), 2200);
        }
      }, 100);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  btnSave.addEventListener("click", commitAction);
  box._commit = commitAction;
  box._setText = (txt) => {
    textarea.value = txt;
    currentText = txt;
    autoFitTextarea();
  };

  if (btnDel) {
    btnDel.addEventListener("click", () => {
      showConfirmModal("Delete Text Block", "Permanently remove this text block from the document?", async () => {
        cancelTransformBox();
        setLoading(true, "Deleting text block...");
        try {
          const res = await fetch(`/api/document/${state.docId}/edit-text`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              edits: [{
                page: state.currentPage,
                bbox: options.origBlock.bbox,
                lines: options.origBlock?.lines,
                new_text: "",
                bg_color: null
              }]
            })
          });
          if (!res.ok) throw new Error("Failed to delete text block");
          const delData = await res.json();
          showToast("Text block deleted!", "success");
          await applyMutationResponse(delData, state.currentPage);
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      });
    });
  }

  function onBoxMoved(curL, curT, curW, curH, moved) {
    if (moved) hasMoved = true;
    updateCoordBadge();
    if (mode === "add") {
      const inX = document.getElementById("newTextX");
      const inY = document.getElementById("newTextY");
      if (inX) inX.value = Math.round(curL * scaleX);
      if (inY) inY.value = Math.round(curT * scaleY);
    }
  }

  function onBoxResized(curL, curT, curW, curH, dir) {
    hasResized = true;
    if (dir && (dir.includes("n") || dir.includes("s"))) {
      isAutoHeight = false;
    }
    autoFitTextarea();
    updateCoordBadge();
    if (mode === "add") {
      const inW = document.getElementById("newTextWidth");
      const inH = document.getElementById("newTextHeight");
      const inX = document.getElementById("newTextX");
      const inY = document.getElementById("newTextY");
      if (inW) inW.value = Math.round(curW * scaleX);
      if (inH) inH.value = Math.round(curH * scaleY);
      if (inX) inX.value = Math.round(curL * scaleX);
      if (inY) inY.value = Math.round(curT * scaleY);
    }
  }

  // 5. Attach Drag & Resize
  makeDraggable(box, pill, onBoxMoved, onBoxMoved);
  makeResizable(box, onBoxResized, onBoxResized);

  interactiveOverlay.appendChild(box);
  activeTransformBox = box;
  updateCoordBadge();
  updateToolbarPosition();
  requestAnimationFrame(() => updateToolbarPosition());
  setTimeout(() => updateToolbarPosition(), 50);
  setTimeout(() => updateToolbarPosition(), 150);

  const onViewportScrollOrResize = () => {
    updateToolbarPosition();
  };
  const canvasViewportEl = document.getElementById("canvasViewport");
  if (canvasViewportEl) canvasViewportEl.addEventListener("scroll", onViewportScrollOrResize, { passive: true });
  window.addEventListener("resize", onViewportScrollOrResize, { passive: true });

  box._cleanup = () => {
    if (canvasViewportEl) canvasViewportEl.removeEventListener("scroll", onViewportScrollOrResize);
    window.removeEventListener("resize", onViewportScrollOrResize);
  };

  setTimeout(() => {
    textarea.focus();
    if (mode === "add") textarea.select();
  }, 20);
}

function initLiveImageTransformBox(options = {}) {
  cancelTransformBox();

  const mode = options.mode || "insert"; // "insert" | "existing"
  const overlay = document.getElementById("interactiveOverlay");
  const overlayRect = overlay.getBoundingClientRect();
  const scaleX = state.pageWidthPt / overlayRect.width;
  const scaleY = state.pageHeightPt / overlayRect.height;

  let currentRotation = options.rotation || 0;
  let currentOpacity = options.opacity !== undefined ? options.opacity : 1.0;
  let currentFlipH = Boolean(options.flipH);
  let currentFlipV = Boolean(options.flipV);
  let isRatioLocked = options.isRatioLocked !== undefined ? options.isRatioLocked : true;
  let currentFileObj = options.fileObj || null;
  let currentImgSrc = options.imgSrc || null;
  let naturalRatio = (options.orig_width && options.orig_height) ? (options.orig_width / options.orig_height) : (options.widthPx && options.heightPx ? options.widthPx / options.heightPx : 1.33);

  let widthPx = options.widthPx || 220;
  let heightPx = options.heightPx || (naturalRatio ? Math.round(widthPx / naturalRatio) : 160);
  let leftPx = options.leftPx !== undefined ? options.leftPx : Math.max(20, (overlayRect.width - widthPx) / 2);
  let topPx = options.topPx !== undefined ? options.topPx : Math.max(30, (overlayRect.height - heightPx) / 3);

  if (mode === "existing") {
    // 1. Hide the corresponding overlay element
    interactiveOverlay.querySelectorAll(".canvas-image-overlay").forEach(el => {
      if (options.divElement === el || (options.xref && el._xref === options.xref) || (options.bbox && JSON.stringify(el._bbox) === JSON.stringify(options.bbox))) {
        el.style.display = "none";
      }
    });

    // 2. Add an underlying backdrop mask directly over the old image location to conceal the baked-in raster
    const underlyingMask = document.createElement("div");
    underlyingMask.className = "element-underlying-mask image-underlying-mask";
    underlyingMask.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
    underlyingMask.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
    underlyingMask.style.width = `${widthPx}px`;
    underlyingMask.style.height = `${heightPx}px`;
    interactiveOverlay.appendChild(underlyingMask);
  }

  const box = document.createElement("div");
  box.className = "live-transform-box mode-image";
  box.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
  box.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
  box.style.width = `${widthPx}px`;
  box.style.height = `${heightPx}px`;

  box._isRatioLocked = isRatioLocked;
  box._getAspectRatio = () => naturalRatio;

  box.addEventListener("mousedown", (e) => e.stopPropagation());
  box.addEventListener("click", (e) => e.stopPropagation());

  // 1. Sleek Floating Top Pill
  const pill = document.createElement("div");
  pill.className = "transform-top-pill";
  pill.innerHTML = `
    <span class="pill-title">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span>${mode === 'insert' ? 'Place Image' : 'Image'}</span>
    </span>
    <span class="pill-badge live-img-coord-badge"></span>
    <span class="pill-close" title="Cancel (Esc)">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>
  `;
  box.appendChild(pill);
  pill.querySelector(".pill-close").addEventListener("click", () => cancelTransformBox(false));

  // 2. Toolbar and helpers
  const toolbar = document.createElement("div");
  toolbar.className = "transform-floating-toolbar";

  function updateImgToolbarPosition() {
    if (!toolbar || !box) return;

    const viewportEl = document.getElementById("canvasViewport");
    const viewportRect = viewportEl ? viewportEl.getBoundingClientRect() : {
      left: 0,
      right: window.innerWidth,
      top: 0,
      bottom: window.innerHeight,
      width: window.innerWidth,
      height: window.innerHeight
    };
    const boxRect = box.getBoundingClientRect();

    // Accurately measure toolbar dimensions
    const tbRect = toolbar.getBoundingClientRect();
    const tbWidth = tbRect.width > 0 ? tbRect.width : (toolbar.offsetWidth || 460);
    const tbHeight = tbRect.height > 0 ? tbRect.height : (toolbar.offsetHeight || 32);

    // 1. Vertical positioning (Above vs Below)
    const spaceAbove = boxRect.top - Math.max(viewportRect.top, 0) - 8;
    const spaceBelow = Math.min(viewportRect.bottom, window.innerHeight) - boxRect.bottom - 8;

    if (spaceAbove < (tbHeight + 35) && spaceBelow >= (tbHeight + 15)) {
      toolbar.classList.add("toolbar-below");
    } else if (spaceBelow < (tbHeight + 15) && spaceAbove >= (tbHeight + 35)) {
      toolbar.classList.remove("toolbar-below");
    } else if (spaceAbove < (tbHeight + 35)) {
      toolbar.classList.add("toolbar-below");
    } else {
      toolbar.classList.remove("toolbar-below");
    }

    // 2. Horizontal clamping: Strictly constrain toolbar within visible viewport margins
    const padding = 8;
    const availWidth = Math.max(260, viewportRect.width - padding * 2);
    const effectiveTbWidth = Math.min(tbWidth, availWidth);

    const screenMinX = viewportRect.left + padding;
    const screenMaxX = viewportRect.right - padding - effectiveTbWidth;

    const idealCenter = boxRect.left + (boxRect.width / 2);
    const idealScreenLeft = idealCenter - (effectiveTbWidth / 2);

    let clampedScreenLeft;
    if (screenMaxX <= screenMinX) {
      clampedScreenLeft = screenMinX;
    } else {
      clampedScreenLeft = Math.max(screenMinX, Math.min(idealScreenLeft, screenMaxX));
    }

    const relLeft = clampedScreenLeft - boxRect.left;
    toolbar.style.left = `${Math.round(relLeft)}px`;
    toolbar.style.transform = "none";
    toolbar.style.right = "auto";
    toolbar.style.maxWidth = `${Math.floor(availWidth)}px`;

    // 3. Keep pill within horizontal viewport bounds as well
    if (pill) {
      const pillRect = pill.getBoundingClientRect();
      const pillWidth = pillRect.width > 0 ? pillRect.width : (pill.offsetWidth || 220);
      const idealPillScreenLeft = boxRect.left;
      const pillMaxX = Math.min(viewportRect.right - padding, window.innerWidth - padding) - pillWidth;
      const pillMinX = Math.max(viewportRect.left + padding, padding);
      let clampedPillScreenLeft = idealPillScreenLeft;
      if (pillMaxX >= pillMinX) {
        clampedPillScreenLeft = Math.max(pillMinX, Math.min(idealPillScreenLeft, pillMaxX));
      }
      const relPillLeft = clampedPillScreenLeft - boxRect.left;
      pill.style.left = `${Math.round(relPillLeft)}px`;
      pill.style.maxWidth = `${Math.floor(availWidth)}px`;
    }
  }

  function updateImgCoords() {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;
    const ptX = Math.round(curL * scaleX);
    const ptY = Math.round(curT * scaleY);
    const ptW = Math.round(curW * scaleX);
    const ptH = Math.round(curH * scaleY);
    const badge = pill.querySelector(".live-img-coord-badge");
    if (badge) badge.textContent = `${ptW}×${ptH}pt @ (${ptX},${ptY})`;
    updateImgToolbarPosition();

    // Sync sidebar inputs if available
    const inX0 = document.getElementById("imgX0");
    const inY0 = document.getElementById("imgY0");
    const inX1 = document.getElementById("imgX1");
    const inY1 = document.getElementById("imgY1");
    if (inX0) inX0.value = ptX;
    if (inY0) inY0.value = ptY;
    if (inX1) inX1.value = ptX + ptW;
    if (inY1) inY1.value = ptY + ptH;
  }

  // 3. Body & Image Display
  const body = document.createElement("div");
  body.className = "transform-editor-body";
  body.style.display = "flex";
  body.style.alignItems = "center";
  body.style.justifyContent = "center";
  body.style.overflow = "hidden";

  const imgEl = document.createElement("img");
  imgEl.className = "transform-preview-img";
  imgEl.style.width = "100%";
  imgEl.style.height = "100%";
  imgEl.style.objectFit = isRatioLocked ? "contain" : "fill";
  imgEl.style.pointerEvents = "none";
  imgEl.style.transition = "transform 0.15s ease, opacity 0.15s ease";

  function applyImgStyles() {
    imgEl.style.opacity = currentOpacity;
    imgEl.style.transform = `rotate(${currentRotation}deg) scale(${currentFlipH ? -1 : 1}, ${currentFlipV ? -1 : 1})`;
    imgEl.style.objectFit = isRatioLocked ? "contain" : "fill";
  }
  applyImgStyles();

  if (currentImgSrc) {
    imgEl.src = currentImgSrc;
    imgEl.onload = () => {
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        naturalRatio = imgEl.naturalWidth / imgEl.naturalHeight;
      }
    };
    body.appendChild(imgEl);
  } else if (options.xref) {
    const src = `/api/document/${state.docId}/image/${options.xref}`;
    imgEl.src = src;
    imgEl.onload = () => {
      if (imgEl.naturalWidth && imgEl.naturalHeight) {
        naturalRatio = imgEl.naturalWidth / imgEl.naturalHeight;
      }
    };
    body.appendChild(imgEl);
  } else {
    body.appendChild(imgEl);
  }
  box.appendChild(body);

  toolbar.innerHTML = `
    <div class="tb-group tb-formatting-group">
      <button type="button" class="tool-btn tb-ratio-btn ${isRatioLocked ? 'active' : ''}" title="Toggle Aspect Ratio Lock">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
        <span>${isRatioLocked ? '1:1 Lock' : 'Free'}</span>
      </button>
      <div class="tb-divider"></div>
      <button type="button" class="tool-btn tb-rotate-btn" title="Rotate 90° Clockwise">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        <span>Rotate</span>
      </button>
      <button type="button" class="tool-btn tb-flip-btn" title="Flip Horizontal">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="8 3 4 7 8 11"/><polyline points="16 21 20 17 16 13"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="20" y1="17" x2="4" y2="17"/></svg>
      </button>
      <div class="tb-divider"></div>
      <div class="tb-opacity-wrap" title="Opacity / Transparency" style="display:flex; align-items:center; gap:3px; font-size:11px;">
        <span style="color:var(--text-muted); font-size:10px;">Op:</span>
        <input type="range" class="tb-opacity-slider" min="10" max="100" value="${Math.round(currentOpacity * 100)}" style="width:48px; cursor:pointer;" />
        <span class="tb-opacity-val" style="font-size:10px; min-width:24px; font-family:monospace;">${Math.round(currentOpacity * 100)}%</span>
      </div>
      ${mode === 'existing' ? `
        <div class="tb-divider"></div>
        <label class="tool-btn tb-replace-btn" title="Replace with new image file" style="cursor:pointer; margin:0;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          <span>Replace</span>
          <input type="file" class="tb-replace-input" accept="image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff" style="display:none;" />
        </label>` : ''}
      <div class="tb-divider"></div>
      <div class="tb-dropdown-wrap layer-dropdown-wrap">
        <button type="button" class="tool-btn tb-layer-btn" title="Layer Depth / Stacking (Z-Index)">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
          <span>Layer</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="layer-dropdown-menu">
          <button type="button" class="layer-item" data-action="bring_to_front" title="Bring to Front (Ctrl + ])">
            <span class="layer-icon">⤊</span>
            <span class="layer-title">Bring to Front</span>
            <span class="layer-shortcut">Ctrl+]</span>
          </button>
          <button type="button" class="layer-item" data-action="bring_forward" title="Bring Forward (Alt + ])">
            <span class="layer-icon">⇡</span>
            <span class="layer-title">Bring Forward</span>
            <span class="layer-shortcut">Alt+]</span>
          </button>
          <button type="button" class="layer-item" data-action="send_backward" title="Send Backward (Alt + [)">
            <span class="layer-icon">⇣</span>
            <span class="layer-title">Send Backward</span>
            <span class="layer-shortcut">Alt+[</span>
          </button>
          <button type="button" class="layer-item" data-action="send_to_back" title="Send to Back (Ctrl + [)">
            <span class="layer-icon">⤋</span>
            <span class="layer-title">Send to Back</span>
            <span class="layer-shortcut">Ctrl+[</span>
          </button>
        </div>
      </div>
    </div>
    <div class="tb-divider action-divider"></div>
    <div class="tb-group tb-actions-group">
      <button type="button" class="tool-btn btn-save" title="Save / Place Image on PDF">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${mode === 'insert' ? 'Place Image' : 'Save'}</span>
      </button>
      ${mode === 'existing' ? `
        <button type="button" class="tool-btn btn-delete" title="Delete Image">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>` : ''}
      <button type="button" class="tool-btn tb-cancel-btn" title="Cancel (Esc)">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <span>Cancel</span>
      </button>
    </div>
  `;
  box.appendChild(toolbar);

  // Attach toolbar listeners
  toolbar.querySelectorAll(".layer-dropdown-menu .layer-item").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const action = btn.dataset.action;
      triggerImgLayer(action);
    });
  });

  function triggerImgLayer(action) {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;
    const x0 = Math.round(curL * scaleX);
    const y0 = Math.round(curT * scaleY);
    const x1 = Math.round(x0 + curW * scaleX);
    const y1 = Math.round(y0 + curH * scaleY);

    executeLayerOrder({
      page: state.currentPage,
      elementType: "image",
      action: action,
      elementId: options.xref,
      bbox: options.bbox || [x0, y0, x1, y1]
    });
  }

  box._triggerLayer = triggerImgLayer;
  const btnRatio = toolbar.querySelector(".tb-ratio-btn");
  btnRatio.addEventListener("click", () => {
    isRatioLocked = !isRatioLocked;
    box._isRatioLocked = isRatioLocked;
    btnRatio.classList.toggle("active", isRatioLocked);
    btnRatio.querySelector("span").textContent = isRatioLocked ? "1:1 Lock" : "Free";
    applyImgStyles();
  });

  const btnRotate = toolbar.querySelector(".tb-rotate-btn");
  btnRotate.addEventListener("click", () => {
    currentRotation = (currentRotation + 90) % 360;
    applyImgStyles();
  });

  const btnFlip = toolbar.querySelector(".tb-flip-btn");
  btnFlip.addEventListener("click", () => {
    currentFlipH = !currentFlipH;
    btnFlip.classList.toggle("active", currentFlipH);
    applyImgStyles();
  });

  const opSlider = toolbar.querySelector(".tb-opacity-slider");
  const opVal = toolbar.querySelector(".tb-opacity-val");
  opSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value) || 100;
    currentOpacity = val / 100.0;
    opVal.textContent = `${val}%`;
    applyImgStyles();
  });

  const inReplace = toolbar.querySelector(".tb-replace-input");
  if (inReplace) {
    inReplace.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        currentFileObj = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (re) => {
          currentImgSrc = re.target.result;
          imgEl.src = currentImgSrc;
          imgEl.onload = () => {
            if (imgEl.naturalWidth && imgEl.naturalHeight) {
              naturalRatio = imgEl.naturalWidth / imgEl.naturalHeight;
            }
          };
          if (!body.contains(imgEl)) body.appendChild(imgEl);
          showToast(`Replacement image selected: ${currentFileObj.name}`, "info");
        };
        reader.readAsDataURL(currentFileObj);
      }
    });
  }

  toolbar.querySelector(".tb-cancel-btn").addEventListener("click", () => cancelTransformBox(false));

  // Commit / Save action
  const btnSave = toolbar.querySelector(".btn-save");
  btnSave.addEventListener("click", async () => {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;

    const x0 = Math.round(curL * scaleX);
    const y0 = Math.round(curT * scaleY);
    const x1 = Math.round(x0 + curW * scaleX);
    const y1 = Math.round(y0 + curH * scaleY);

    if (mode === "insert" && currentFileObj) {
      cancelTransformBox(false);
      setLoading(true, "Placing image on PDF...");
      const formData = new FormData();
      formData.append("file", currentFileObj);
      formData.append("page", state.currentPage);
      formData.append("x0", x0);
      formData.append("y0", y0);
      formData.append("x1", x1);
      formData.append("y1", y1);
      formData.append("opacity", currentOpacity);
      formData.append("rotation", currentRotation);
      formData.append("flip_h", currentFlipH);
      formData.append("flip_v", currentFlipV);

      try {
        const res = await fetch(`/api/document/${state.docId}/insert-image`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Failed to place image");
        const data = await res.json();
        showToast("Image placed successfully!", "success");
        await applyMutationResponse(data, state.currentPage);

        // Highlight placed image
        setTimeout(() => {
          const matchingImg = Array.from(interactiveOverlay.querySelectorAll(".canvas-image-overlay")).find(el => {
            const l = parseFloat(el.style.left) || 0;
            const t = parseFloat(el.style.top) || 0;
            return Math.abs(l - curL) < 25 && Math.abs(t - curT) < 25;
          });
          if (matchingImg) {
            matchingImg.classList.add("recently-placed");
            setTimeout(() => matchingImg.classList.remove("recently-placed"), 2200);
          }
        }, 100);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    } else if (mode === "existing") {
      cancelTransformBox(true);
      setLoading(true, currentFileObj ? "Replacing image on PDF..." : "Updating image position...");
      try {
        let res;
        if (currentFileObj) {
          const formData = new FormData();
          formData.append("file", currentFileObj);
          formData.append("page", state.currentPage);
          formData.append("x0", x0);
          formData.append("y0", y0);
          formData.append("x1", x1);
          formData.append("y1", y1);
          if (options.xref) formData.append("xref", options.xref);
          formData.append("opacity", currentOpacity);
          formData.append("rotation", currentRotation);
          formData.append("flip_h", currentFlipH);
          formData.append("flip_v", currentFlipV);

          res = await fetch(`/api/document/${state.docId}/replace-image`, {
            method: "POST",
            body: formData
          });
        } else {
          res = await fetch(`/api/document/${state.docId}/move-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: state.currentPage,
              old_bbox: options.bbox,
              new_bbox: [x0, y0, x1, y1],
              xref: options.xref,
              opacity: currentOpacity,
              rotation: currentRotation,
              flip_h: currentFlipH,
              flip_v: currentFlipV
            })
          });
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to update image");
        }
        const data = await res.json();
        showToast(currentFileObj ? "Image replaced successfully!" : "Image position updated!", "success");
        await applyMutationResponse(data, state.currentPage);
      } catch (err) {
        cancelTransformBox(false);
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    }
  });

  const btnDel = toolbar.querySelector(".btn-delete");
  if (btnDel) {
    btnDel.addEventListener("click", () => {
      showConfirmModal("Delete Image", "Permanently remove this image from the document?", async () => {
        cancelTransformBox(true);
        setLoading(true, "Removing image...");
        try {
          const res = await fetch(`/api/document/${state.docId}/delete-image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              page: state.currentPage,
              bbox: options.bbox,
              xref: options.xref
            })
          });
          if (!res.ok) throw new Error("Failed to delete image");
          const data = await res.json();
          showToast("Image removed successfully!", "success");
          await applyMutationResponse(data, state.currentPage);
        } catch (err) {
          cancelTransformBox(false);
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      });
    });
  }

  makeDraggable(box, pill, updateImgCoords, updateImgCoords);
  makeDraggable(box, body, updateImgCoords, updateImgCoords);
  makeResizable(box, updateImgCoords, updateImgCoords);

  interactiveOverlay.appendChild(box);
  activeTransformBox = box;
  updateImgCoords();
  applyImgStyles();
  updateImgToolbarPosition();
  requestAnimationFrame(() => updateImgToolbarPosition());
  setTimeout(() => updateImgToolbarPosition(), 50);
  setTimeout(() => updateImgToolbarPosition(), 150);

  const onImgViewportScrollOrResize = () => {
    updateImgToolbarPosition();
  };
  const canvasViewportEl = document.getElementById("canvasViewport");
  if (canvasViewportEl) canvasViewportEl.addEventListener("scroll", onImgViewportScrollOrResize, { passive: true });
  window.addEventListener("resize", onImgViewportScrollOrResize, { passive: true });

  box._cleanup = () => {
    if (canvasViewportEl) canvasViewportEl.removeEventListener("scroll", onImgViewportScrollOrResize);
    window.removeEventListener("resize", onImgViewportScrollOrResize);
  };
}

// ==========================================================================
// Universal Live Shape Transform Engine (Add & Edit Shapes)
// ==========================================================================

function rgbToHex(color) {
  if (!color) return "#2563eb";
  if (Array.isArray(color)) {
    if (color.length === 0) return "#ffffff";
    const r = Math.round(color[0] <= 1.0 ? color[0] * 255 : color[0]);
    const g = Math.round(color[1] <= 1.0 ? color[1] * 255 : color[1]);
    const b = Math.round(color[2] <= 1.0 ? color[2] * 255 : color[2]);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
  if (typeof color === "string" && color.startsWith("#")) return color;
  return "#2563eb";
}

function initLiveShapeTransformBox(options = {}) {
  cancelTransformBox();

  const mode = options.mode || "insert"; // "insert" | "existing"
  const overlay = document.getElementById("interactiveOverlay");
  const overlayRect = overlay.getBoundingClientRect();
  const scaleX = state.pageWidthPt / overlayRect.width;
  const scaleY = state.pageHeightPt / overlayRect.height;

  let shapeType = options.shapeType || "rect"; // "rect" | "circle" | "line"
  let strokeColor = options.strokeColor || "#2563eb";
  let fillColor = options.fillColor !== undefined ? options.fillColor : null;
  let strokeWidth = options.strokeWidth !== undefined ? parseFloat(options.strokeWidth) : 2.0;

  let widthPx = options.widthPx || 180;
  let heightPx = options.heightPx || 120;
  let leftPx = options.leftPx !== undefined ? options.leftPx : Math.max(20, (overlayRect.width - widthPx) / 2);
  let topPx = options.topPx !== undefined ? options.topPx : Math.max(30, (overlayRect.height - heightPx) / 3);

  // If editing an existing shape, conceal original on background
  if (mode === "existing" && options.annot) {
    interactiveOverlay.querySelectorAll(".shape-annotation-wrapper").forEach(el => {
      if (options.divElement === el || el.dataset.annotIndex === String(options.annot.index)) {
        el.style.display = "none";
      }
    });

    const underlyingMask = document.createElement("div");
    underlyingMask.className = "element-underlying-mask shape-underlying-mask";
    underlyingMask.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
    underlyingMask.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
    underlyingMask.style.width = `${widthPx}px`;
    underlyingMask.style.height = `${heightPx}px`;
    interactiveOverlay.appendChild(underlyingMask);
  }

  const box = document.createElement("div");
  box.className = `live-transform-box mode-shape mode-shape-${shapeType}`;
  box.style.left = `${Math.max(0, Math.min(leftPx, overlayRect.width - widthPx))}px`;
  box.style.top = `${Math.max(0, Math.min(topPx, overlayRect.height - heightPx))}px`;
  box.style.width = `${widthPx}px`;
  box.style.height = `${heightPx}px`;

  box.addEventListener("mousedown", (e) => e.stopPropagation());
  box.addEventListener("click", (e) => e.stopPropagation());

  // 1. Sleek Floating Top Pill
  const pill = document.createElement("div");
  pill.className = "transform-top-pill";
  function updatePillTitle() {
    const typeLabel = shapeType === "rect" ? "Rectangle" : (shapeType === "circle" ? "Circle" : "Line");
    const titleSpan = pill.querySelector(".pill-title span");
    if (titleSpan) titleSpan.textContent = `${mode === "existing" ? "Edit Shape" : "New Shape"} (${typeLabel})`;
  }
  pill.innerHTML = `
    <span class="pill-title">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
      <span>${mode === "existing" ? "Edit Shape" : "New Shape"}</span>
    </span>
    <span class="pill-badge live-shape-coord-badge"></span>
    <span class="pill-close" title="Cancel (Esc)">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </span>
  `;
  box.appendChild(pill);
  pill.querySelector(".pill-close").addEventListener("click", () => cancelTransformBox(false));

  // 2. Floating Micro-Toolbar
  const toolbar = document.createElement("div");
  toolbar.className = "transform-floating-toolbar";

  function updateShapeToolbarPosition() {
    if (!toolbar || !box) return;
    const viewportEl = document.getElementById("canvasViewport");
    const viewportRect = viewportEl ? viewportEl.getBoundingClientRect() : {
      left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight
    };
    const boxRect = box.getBoundingClientRect();
    const tbRect = toolbar.getBoundingClientRect();
    const tbWidth = tbRect.width > 0 ? tbRect.width : (toolbar.offsetWidth || 440);
    const tbHeight = tbRect.height > 0 ? tbRect.height : (toolbar.offsetHeight || 32);

    const spaceAbove = boxRect.top - Math.max(viewportRect.top, 0) - 8;
    const spaceBelow = Math.min(viewportRect.bottom, window.innerHeight) - boxRect.bottom - 8;

    if (spaceAbove < (tbHeight + 35) && spaceBelow >= (tbHeight + 15)) {
      toolbar.classList.add("toolbar-below");
    } else if (spaceBelow < (tbHeight + 15) && spaceAbove >= (tbHeight + 35)) {
      toolbar.classList.remove("toolbar-below");
    } else if (spaceAbove < (tbHeight + 35)) {
      toolbar.classList.add("toolbar-below");
    } else {
      toolbar.classList.remove("toolbar-below");
    }

    const padding = 8;
    const availWidth = Math.max(260, viewportRect.width - padding * 2);
    const effectiveTbWidth = Math.min(tbWidth, availWidth);
    const screenMinX = viewportRect.left + padding;
    const screenMaxX = viewportRect.right - padding - effectiveTbWidth;
    const idealCenter = boxRect.left + (boxRect.width / 2);
    const idealScreenLeft = idealCenter - (effectiveTbWidth / 2);
    let clampedScreenLeft = (screenMaxX <= screenMinX) ? screenMinX : Math.max(screenMinX, Math.min(idealScreenLeft, screenMaxX));

    const relLeft = clampedScreenLeft - boxRect.left;
    toolbar.style.left = `${Math.round(relLeft)}px`;
    toolbar.style.transform = "none";
    toolbar.style.right = "auto";
    toolbar.style.maxWidth = `${Math.floor(availWidth)}px`;

    if (pill) {
      const pillRect = pill.getBoundingClientRect();
      const pillWidth = pillRect.width > 0 ? pillRect.width : (pill.offsetWidth || 220);
      const idealPillScreenLeft = boxRect.left;
      const pillMaxX = Math.min(viewportRect.right - padding, window.innerWidth - padding) - pillWidth;
      const pillMinX = Math.max(viewportRect.left + padding, padding);
      let clampedPillScreenLeft = idealPillScreenLeft;
      if (pillMaxX >= pillMinX) {
        clampedPillScreenLeft = Math.max(pillMinX, Math.min(idealPillScreenLeft, pillMaxX));
      }
      const relPillLeft = clampedPillScreenLeft - boxRect.left;
      pill.style.left = `${Math.round(relPillLeft)}px`;
      pill.style.maxWidth = `${Math.floor(availWidth)}px`;
    }
  }

  function updateShapeCoordBadge() {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;
    const ptX = Math.round(curL * scaleX);
    const ptY = Math.round(curT * scaleY);
    const ptW = Math.round(curW * scaleX);
    const ptH = Math.round(curH * scaleY);
    const badge = pill.querySelector(".live-shape-coord-badge");
    if (badge) {
      badge.textContent = `${ptW}×${ptH}pt @ (${ptX},${ptY})`;
    }
    updatePillTitle();
    updateShapeToolbarPosition();

    // Sync to sidebar inputs
    const inX1 = document.getElementById("shapeStartX");
    const inY1 = document.getElementById("shapeStartY");
    const inX2 = document.getElementById("shapeEndX");
    const inY2 = document.getElementById("shapeEndY");
    if (inX1) inX1.value = ptX;
    if (inY1) inY1.value = ptY;
    if (inX2) inX2.value = ptX + ptW;
    if (inY2) inY2.value = ptY + ptH;

    const inType = document.getElementById("shapeType");
    const inStroke = document.getElementById("shapeColor");
    const inFill = document.getElementById("shapeFill");
    const inWidth = document.getElementById("shapeWidth");
    if (inType && inType.value !== shapeType) inType.value = shapeType;
    if (inStroke && inStroke.value !== strokeColor) inStroke.value = strokeColor;
    if (inFill) inFill.value = fillColor || "#ffffff";
    if (inWidth && parseFloat(inWidth.value) !== strokeWidth) inWidth.value = strokeWidth;
  }

  // 3. Editor Body & Live SVG
  const body = document.createElement("div");
  body.className = "transform-editor-body";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "transform-shape-svg");
  body.appendChild(svg);
  box.appendChild(body);

  function renderShapeSvg() {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const W = box.offsetWidth;
    const H = box.offsetHeight;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);

    const effStroke = Math.max(1, strokeWidth * (1.0 / scaleY));
    const pad = effStroke / 2;

    if (shapeType === "rect") {
      const rectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rectEl.setAttribute("x", pad);
      rectEl.setAttribute("y", pad);
      rectEl.setAttribute("width", Math.max(1, W - effStroke));
      rectEl.setAttribute("height", Math.max(1, H - effStroke));
      rectEl.setAttribute("stroke", strokeColor);
      rectEl.setAttribute("stroke-width", effStroke);
      rectEl.setAttribute("fill", fillColor || "none");
      rectEl.setAttribute("rx", "1");
      svg.appendChild(rectEl);
    } else if (shapeType === "circle") {
      const ellipseEl = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      ellipseEl.setAttribute("cx", W / 2);
      ellipseEl.setAttribute("cy", H / 2);
      ellipseEl.setAttribute("rx", Math.max(1, (W - effStroke) / 2));
      ellipseEl.setAttribute("ry", Math.max(1, (H - effStroke) / 2));
      ellipseEl.setAttribute("stroke", strokeColor);
      ellipseEl.setAttribute("stroke-width", effStroke);
      ellipseEl.setAttribute("fill", fillColor || "none");
      svg.appendChild(ellipseEl);
    } else if (shapeType === "line") {
      const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
      lineEl.setAttribute("x1", pad);
      lineEl.setAttribute("y1", pad);
      lineEl.setAttribute("x2", Math.max(1, W - pad));
      lineEl.setAttribute("y2", Math.max(1, H - pad));
      lineEl.setAttribute("stroke", strokeColor);
      lineEl.setAttribute("stroke-width", effStroke);
      lineEl.setAttribute("stroke-linecap", "round");
      svg.appendChild(lineEl);
    }
  }

  // 4. Toolbar Controls & Markup
  toolbar.innerHTML = `
    <div class="tb-group tb-shape-controls">
      <select class="tb-shape-type-select" title="Shape Type" style="height: 24px; padding: 1px 4px; font-size: 11px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--bg-primary); color: var(--text-main); cursor: pointer;">
        <option value="rect" ${shapeType === "rect" ? "selected" : ""}>Rectangle</option>
        <option value="circle" ${shapeType === "circle" ? "selected" : ""}>Circle</option>
        <option value="line" ${shapeType === "line" ? "selected" : ""}>Line</option>
      </select>
      <div class="tb-divider"></div>
      <label style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-dim); cursor: pointer;" title="Stroke / Border Color">
        <span>Stroke</span>
        <input type="color" class="tb-stroke-color color-picker" value="${strokeColor}" style="width: 20px; height: 20px; border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; padding: 0;" />
      </label>
      <label style="display: inline-flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-dim); cursor: pointer;" title="Fill Color">
        <span>Fill</span>
        <input type="color" class="tb-fill-color color-picker" value="${fillColor || '#ffffff'}" style="width: 20px; height: 20px; border: 1px solid var(--border-color); border-radius: 3px; cursor: pointer; padding: 0; opacity: ${fillColor ? '1' : '0.5'};" />
      </label>
      <button type="button" class="tool-btn tb-no-fill-btn ${!fillColor ? 'active' : ''}" title="Toggle Transparent Fill">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="1" y1="1" x2="23" y2="23"/><circle cx="12" cy="12" r="10"/></svg>
        <span>No Fill</span>
      </button>
      <div class="tb-divider"></div>
      <button type="button" class="tool-btn tb-width-dec" title="Decrease Width">-</button>
      <input type="number" class="tb-width-input" value="${Math.round(strokeWidth)}" min="1" max="50" style="width: 28px; height: 20px; text-align: center; font-size: 11px; border: 1px solid var(--border-color); border-radius: 3px; background: var(--bg-primary); color: var(--text-main);" />
      <button type="button" class="tool-btn tb-width-inc" title="Increase Width">+</button>
    </div>
    <div class="tb-divider"></div>
    <div class="tb-actions-group">
      <button type="button" class="tool-btn btn-save" title="Apply Shape to PDF (Ctrl+Enter)" style="background: var(--accent-primary, #3b82f6); color: #ffffff; font-weight: 600;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Apply</span>
      </button>
      <button type="button" class="tool-btn btn-delete" title="Delete Shape" style="color: #ef4444;">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
      <button type="button" class="tool-btn tb-cancel-btn" title="Cancel (Esc)">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
  `;

  box.appendChild(toolbar);

  const selType = toolbar.querySelector(".tb-shape-type-select");
  const inStrokeInput = toolbar.querySelector(".tb-stroke-color");
  const inFillInput = toolbar.querySelector(".tb-fill-color");
  const btnNoFill = toolbar.querySelector(".tb-no-fill-btn");
  const btnWidthDec = toolbar.querySelector(".tb-width-dec");
  const inWidthInput = toolbar.querySelector(".tb-width-input");
  const btnWidthInc = toolbar.querySelector(".tb-width-inc");
  const btnSave = toolbar.querySelector(".btn-save");
  const btnDelete = toolbar.querySelector(".btn-delete");
  const btnCancel = toolbar.querySelector(".tb-cancel-btn");

  selType.addEventListener("change", (e) => {
    shapeType = e.target.value;
    box.className = `live-transform-box mode-shape mode-shape-${shapeType}`;
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  inStrokeInput.addEventListener("input", (e) => {
    strokeColor = e.target.value;
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  inFillInput.addEventListener("input", (e) => {
    fillColor = e.target.value;
    btnNoFill.classList.remove("active");
    inFillInput.style.opacity = "1";
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  btnNoFill.addEventListener("click", () => {
    if (fillColor) {
      fillColor = null;
      btnNoFill.classList.add("active");
      inFillInput.style.opacity = "0.5";
    } else {
      fillColor = inFillInput.value || "#ffffff";
      btnNoFill.classList.remove("active");
      inFillInput.style.opacity = "1";
    }
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  btnWidthDec.addEventListener("click", () => {
    strokeWidth = Math.max(1, strokeWidth - 1);
    inWidthInput.value = Math.round(strokeWidth);
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  btnWidthInc.addEventListener("click", () => {
    strokeWidth = Math.min(50, strokeWidth + 1);
    inWidthInput.value = Math.round(strokeWidth);
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  inWidthInput.addEventListener("input", (e) => {
    strokeWidth = Math.max(1, Math.min(50, parseFloat(e.target.value) || 2));
    renderShapeSvg();
    updateShapeCoordBadge();
  });

  btnCancel.addEventListener("click", () => cancelTransformBox(false));

  // 5. Commit Action
  async function commitShapeAction() {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const curW = box.offsetWidth;
    const curH = box.offsetHeight;

    const ptX0 = Math.round(curL * scaleX);
    const ptY0 = Math.round(curT * scaleY);
    const ptX1 = Math.round(ptX0 + curW * scaleX);
    const ptY1 = Math.round(ptY0 + curH * scaleY);
    const bbox = [ptX0, ptY0, ptX1, ptY1];
    const points = [[ptX0, ptY0], [ptX1, ptY1]];

    const color = hexToRgb(strokeColor);
    const fill = fillColor ? hexToRgb(fillColor) : null;
    const width = strokeWidth;

    cancelTransformBox();
    setLoading(true, mode === "existing" ? "Updating shape in PDF..." : "Adding shape to PDF...");

    try {
      let mutationData = null;
      if (mode === "insert") {
        const payload = {
          shapes: [{
            page: state.currentPage,
            type: shapeType,
            bbox: bbox,
            points: points,
            color: color,
            fill_color: fill,
            width: width
          }]
        };
        const res = await fetch(`/api/document/${state.docId}/add-shape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to add shape");
        mutationData = await res.json();
        showToast("Shape added successfully!", "success");
      } else {
        const payload = {
          page: state.currentPage,
          index: options.annot.index,
          bbox: bbox,
          type: shapeType,
          color: color,
          fill_color: fill,
          width: width
        };
        const res = await fetch(`/api/document/${state.docId}/annotations/update`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to update shape");
        mutationData = await res.json();
        showToast("Shape updated successfully!", "success");
      }

      await applyMutationResponse(mutationData, state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  btnSave.addEventListener("click", commitShapeAction);
  box._commit = commitShapeAction;

  btnDelete.addEventListener("click", () => {
    if (mode === "insert") {
      cancelTransformBox(false);
      return;
    }
    showConfirmModal("Delete Shape", "Permanently remove this shape from the document?", async () => {
      cancelTransformBox();
      setLoading(true, "Deleting shape...");
      try {
        const res = await fetch(`/api/document/${state.docId}/annotations/delete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: state.currentPage, index: options.annot.index })
        });
        if (!res.ok) throw new Error("Failed to delete shape");
        const delData = await res.json();
        showToast("Shape removed!", "info");
        await applyMutationResponse(delData, state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  });

  // Layer ordering integration
  box._triggerLayer = (action) => {
    const curL = parseFloat(box.style.left) || 0;
    const curT = parseFloat(box.style.top) || 0;
    const ptX0 = Math.round(curL * scaleX);
    const ptY0 = Math.round(curT * scaleY);
    const ptX1 = Math.round(ptX0 + box.offsetWidth * scaleX);
    const ptY1 = Math.round(ptY0 + box.offsetHeight * scaleY);
    executeLayerOrder({
      page: state.currentPage,
      elementType: "shape",
      action: action,
      elementId: options.annot ? options.annot.id : `shape_${state.currentPage}`,
      bbox: [ptX0, ptY0, ptX1, ptY1],
      color: hexToRgb(strokeColor)
    });
  };

  box._syncFromSidebar = () => {
    const inType = document.getElementById("shapeType")?.value;
    const inStroke = document.getElementById("shapeColor")?.value;
    const inFill = document.getElementById("shapeFill")?.value;
    const inWidth = parseFloat(document.getElementById("shapeWidth")?.value);
    if (inType) {
      shapeType = inType;
      if (selType) selType.value = shapeType;
      box.className = `live-transform-box mode-shape mode-shape-${shapeType}`;
    }
    if (inStroke) {
      strokeColor = inStroke;
      if (inStrokeInput) inStrokeInput.value = strokeColor;
    }
    if (inFill) {
      fillColor = inFill === "#ffffff" ? null : inFill;
      if (inFillInput) {
        inFillInput.value = inFill;
        inFillInput.style.opacity = fillColor ? "1" : "0.5";
      }
      if (btnNoFill) btnNoFill.classList.toggle("active", !fillColor);
    }
    if (!isNaN(inWidth)) {
      strokeWidth = inWidth;
      if (inWidthInput) inWidthInput.value = Math.round(strokeWidth);
    }
    renderShapeSvg();
    updatePillTitle();
  };

  box._syncCoordsFromSidebar = () => {
    const x1 = parseFloat(document.getElementById("shapeStartX")?.value);
    const y1 = parseFloat(document.getElementById("shapeStartY")?.value);
    const x2 = parseFloat(document.getElementById("shapeEndX")?.value);
    const y2 = parseFloat(document.getElementById("shapeEndY")?.value);
    if (!isNaN(x1) && !isNaN(y1) && !isNaN(x2) && !isNaN(y2)) {
      const curL = Math.min(x1, x2) / scaleX;
      const curT = Math.min(y1, y2) / scaleY;
      const curW = Math.abs(x2 - x1) / scaleX;
      const curH = Math.abs(y2 - y1) / scaleY;
      box.style.left = `${Math.max(0, Math.min(curL, overlayRect.width - curW))}px`;
      box.style.top = `${Math.max(0, Math.min(curT, overlayRect.height - curH))}px`;
      box.style.width = `${Math.max(30, curW)}px`;
      box.style.height = `${Math.max(20, curH)}px`;
      renderShapeSvg();
      updateShapeCoordBadge();
    }
  };

  // 6. Drag & Resize Attachments
  function onBoxMoved(curL, curT, curW, curH, moved) {
    updateShapeCoordBadge();
  }

  function onBoxResized(curL, curT, curW, curH, dir) {
    renderShapeSvg();
    updateShapeCoordBadge();
  }

  makeDraggable(box, pill, onBoxMoved, onBoxMoved);
  makeDraggable(box, body, onBoxMoved, onBoxMoved);
  makeResizable(box, onBoxResized, onBoxResized);

  interactiveOverlay.appendChild(box);
  activeTransformBox = box;
  renderShapeSvg();
  updateShapeCoordBadge();
  updateShapeToolbarPosition();
  requestAnimationFrame(() => updateShapeToolbarPosition());
  setTimeout(() => updateShapeToolbarPosition(), 50);
  setTimeout(() => updateShapeToolbarPosition(), 150);

  const onViewportScrollOrResize = () => {
    updateShapeToolbarPosition();
  };
  const canvasViewportEl = document.getElementById("canvasViewport");
  if (canvasViewportEl) canvasViewportEl.addEventListener("scroll", onViewportScrollOrResize, { passive: true });
  window.addEventListener("resize", onViewportScrollOrResize, { passive: true });

  const onKeyDown = (e) => {
    if (e.key === "Escape") {
      cancelTransformBox(false);
      window.removeEventListener("keydown", onKeyDown);
    } else if (e.key === "Enter" && e.ctrlKey) {
      commitShapeAction();
      window.removeEventListener("keydown", onKeyDown);
    }
  };
  window.addEventListener("keydown", onKeyDown);

  box._cleanup = () => {
    if (canvasViewportEl) canvasViewportEl.removeEventListener("scroll", onViewportScrollOrResize);
    window.removeEventListener("resize", onViewportScrollOrResize);
    window.removeEventListener("keydown", onKeyDown);
  };
}

function selectShapeForEdit(annot, wrapper) {
  if (state.activeTab !== "tab-shapes") {
    const shapesTabBtn = document.querySelector('[data-tab="tab-shapes"]');
    if (shapesTabBtn) {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
      shapesTabBtn.classList.add("active");
      const targetPane = document.getElementById("tab-shapes");
      if (targetPane) targetPane.classList.add("active");
      state.activeTab = "tab-shapes";
    }
  }
  if (typeof window.setShapesSubMode === "function") {
    window.setShapesSubMode("shapes");
  }

  const screenRect = pageToScreenRect(annot.rect);
  const typeMap = { "Square": "rect", "Rect": "rect", "Circle": "circle", "Line": "line", "Polygon": "rect", "PolyLine": "line" };
  const sType = typeMap[annot.type] || "rect";
  const sStroke = annot.colors?.stroke ? rgbToHex(annot.colors.stroke) : "#2563eb";
  const sFill = (annot.colors?.fill && annot.colors.fill.length) ? rgbToHex(annot.colors.fill) : null;
  const sWidth = annot.border?.width || 2;

  initLiveShapeTransformBox({
    mode: "existing",
    annot: annot,
    divElement: wrapper,
    shapeType: sType,
    strokeColor: sStroke,
    fillColor: sFill,
    strokeWidth: sWidth,
    leftPx: screenRect.left,
    topPx: screenRect.top,
    widthPx: screenRect.width,
    heightPx: screenRect.height
  });
}

window.initLiveShapeTransformBox = initLiveShapeTransformBox;
window.selectShapeForEdit = selectShapeForEdit;

function handleImageFileForPlacement(file, targetLeftPx, targetTopPx) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (re) => {
    const dataUrl = re.target.result;
    if (placedImagePreviewImg) placedImagePreviewImg.src = dataUrl;
    if (imagePlacementPreview) imagePlacementPreview.style.display = "block";

    // Switch to image tab in sidebar
    const imgTabBtn = document.querySelector('.tab-btn[data-tab="tab-image"]');
    if (imgTabBtn && !imgTabBtn.classList.contains("active")) {
      imgTabBtn.click();
    }

    // Preload image to extract natural aspect ratio
    const img = new Image();
    img.onload = () => {
      const origW = img.naturalWidth || 300;
      const origH = img.naturalHeight || 200;
      const ratio = (origH > 0) ? (origW / origH) : 1.33;

      const overlay = document.getElementById("interactiveOverlay");
      const overlayRect = overlay.getBoundingClientRect();
      const defaultW = Math.min(240, Math.round(overlayRect.width * 0.45));
      const defaultH = Math.round(defaultW / ratio);

      const left = targetLeftPx !== undefined ? Math.max(0, Math.min(targetLeftPx, overlayRect.width - defaultW)) : Math.max(20, (overlayRect.width - defaultW) / 2);
      const top = targetTopPx !== undefined ? Math.max(0, Math.min(targetTopPx, overlayRect.height - defaultH)) : Math.max(30, (overlayRect.height - defaultH) / 3);

      initLiveImageTransformBox({
        mode: "insert",
        leftPx: left,
        topPx: top,
        widthPx: defaultW,
        heightPx: defaultH,
        fileObj: file,
        imgSrc: dataUrl,
        orig_width: origW,
        orig_height: origH,
        isRatioLocked: true
      });
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
}

// Backward compatibility aliases
const initWysiwygAtPoint = (x, y, txt) => initLiveTextTransformBox({ mode: "add", leftPx: x, topPx: y, text: txt });
const cancelWysiwyg = cancelTransformBox;
const commitWysiwygDirect = () => { if (activeTransformBox && activeTransformBox._commit) activeTransformBox._commit(); };
const initInteractiveImageBox = (src, file) => handleImageFileForPlacement(file);
const setupCornerResize = (box, h, dir) => {};

// Freehand Drawing Canvas
function setupFreehandCanvas() {
  if (!inkCanvas) return;
  const ctx = inkCanvas.getContext("2d");
  let drawing = false;

  btnToggleInk.addEventListener("click", () => {
    toggleInkMode(!state.isInkMode);
  });

  if (btnInkEraser) {
    btnInkEraser.addEventListener("click", () => {
      state.isEraserMode = !state.isEraserMode;
      btnInkEraser.classList.toggle("active", state.isEraserMode);
      showToast(state.isEraserMode ? "Eraser mode ON" : "Eraser mode OFF", "info");
    });
  }

  if (btnInkUndo) {
    btnInkUndo.addEventListener("click", () => {
      if (state.inkStrokes.length > 0) {
        state.inkStrokes.pop();
        redrawInkCanvas();
        showToast("Undone last ink stroke.", "info");
      }
    });
  }

  function getCanvasCoords(e) {
    const rect = inkCanvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  inkCanvas.addEventListener("mousedown", (e) => {
    if (!state.isInkMode) return;
    drawing = true;
    const pt = getCanvasCoords(e);
    state.currentStroke = [[pt.x, pt.y]];
    redrawInkCanvas();
  });

  inkCanvas.addEventListener("mousemove", (e) => {
    if (!drawing || !state.isInkMode) return;
    const pt = getCanvasCoords(e);
    
    // Distance-based thinning for smoother professional curves
    const lastPt = state.currentStroke[state.currentStroke.length - 1];
    const dx = pt.x - lastPt[0];
    const dy = pt.y - lastPt[1];
    if (dx * dx + dy * dy < 12) return;
    
    state.currentStroke.push([pt.x, pt.y]);
    redrawInkCanvas();
  });

  inkCanvas.addEventListener("mouseup", () => {
    if (!drawing) return;
    drawing = false;
    if (state.currentStroke.length > 0) {
      state.inkStrokes.push(state.currentStroke);
    }
    state.currentStroke = [];
    redrawInkCanvas();
  });
}

function redrawInkCanvas() {
  if (!inkCanvas) return;
  const ctx = inkCanvas.getContext("2d");
  ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);

  const color = state.isEraserMode ? "#ffffff" : document.getElementById("inkColor").value;
  const width = parseFloat(document.getElementById("inkWidth").value) || 3;

  const drawSmoothStroke = (stroke) => {
    if (!stroke || stroke.length === 0) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stroke[0][0], stroke[0][1]);
    
    if (stroke.length === 1) {
      ctx.lineTo(stroke[0][0] + 0.1, stroke[0][1]);
    } else if (stroke.length === 2) {
      ctx.lineTo(stroke[1][0], stroke[1][1]);
    } else {
      for (let i = 1; i < stroke.length - 1; i++) {
        const xc = (stroke[i][0] + stroke[i + 1][0]) / 2;
        const yc = (stroke[i][1] + stroke[i + 1][1]) / 2;
        ctx.quadraticCurveTo(stroke[i][0], stroke[i][1], xc, yc);
      }
      const last = stroke[stroke.length - 1];
      const prev = stroke[stroke.length - 2];
      ctx.quadraticCurveTo(prev[0], prev[1], last[0], last[1]);
    }
    ctx.stroke();
  };

  state.inkStrokes.forEach(drawSmoothStroke);
  if (state.currentStroke && state.currentStroke.length > 0) {
    drawSmoothStroke(state.currentStroke);
  }
}

function toggleInkMode(enable) {
  state.isInkMode = enable;
  if (enable) {
    inkCanvas.style.display = "block";
    inkControlsArea.style.display = "block";
    btnToggleInk.classList.add("active");
    btnToggleInk.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg><span>Freehand Mode: ON</span>';
    syncInkCanvasSize();
  } else {
    inkCanvas.style.display = "none";
    if (inkControlsArea) inkControlsArea.style.display = "none";
    btnToggleInk.classList.remove("active");
    btnToggleInk.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.375 2.625a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4Z"></path></svg><span>Freehand Mode: OFF</span>';
  }
}

function syncInkCanvasSize() {
  if (!inkCanvas || !pageCanvasWrapper) return;
  const rect = pageCanvasWrapper.getBoundingClientRect();
  inkCanvas.width = rect.width;
  inkCanvas.height = rect.height;
}

// ==========================================================================
// Tool Operations
// ==========================================================================

function setupToolActions() {
  // 1. Block Edit & Find/Replace
  newTextWithBox.addEventListener("change", (e) => {
    newTextBoxOptions.style.display = e.target.checked ? "block" : "none";
  });

  // Block editor bold / italic toggle buttons
  if (btnBlockBold) {
    btnBlockBold.addEventListener("click", () => {
      const active = btnBlockBold.classList.toggle("active");
      btnBlockBold.style.backgroundColor = active ? "var(--primary, #3b82f6)" : "";
      btnBlockBold.style.color = active ? "#ffffff" : "";
    });
  }

  if (btnBlockItalic) {
    btnBlockItalic.addEventListener("click", () => {
      const active = btnBlockItalic.classList.toggle("active");
      btnBlockItalic.style.backgroundColor = active ? "var(--primary, #3b82f6)" : "";
      btnBlockItalic.style.color = active ? "#ffffff" : "";
    });
  }

  btnCloseBlockEdit.addEventListener("click", () => {
    blockEditorContainer.style.display = "none";
    interactiveOverlay.querySelectorAll(".text-block-highlight").forEach(d => d.classList.remove("selected"));
    state.selectedBlock = null;
    cancelTransformBox(false);
  });

  btnApplyBlockEdit.addEventListener("click", async () => {
    if (!state.selectedBlock) return;
    const newText = blockEditText.value;
    const fontSize = parseFloat(blockEditSize.value) || null;
    const textColor = hexToRgb(blockEditColor.value);
    const isBold = btnBlockBold ? btnBlockBold.classList.contains("active") : false;
    const isItalic = btnBlockItalic ? btnBlockItalic.classList.contains("active") : false;
    const fontFamily = blockEditFont ? blockEditFont.value : "auto";
    const fontName = fontFamily === "auto" ? (state.selectedBlock.font_name || "helv") : fontFamily;
    const align = blockEditAlign ? parseInt(blockEditAlign.value, 10) || 0 : 0;

    setLoading(true, "Updating text block...");
    const payload = {
      edits: [{
        page: state.currentPage,
        bbox: state.selectedBlock.bbox,
        lines: state.selectedBlock.lines,
        new_text: newText,
        font_size: fontSize,
        font_name: fontName,
        is_bold: isBold,
        is_italic: isItalic,
        align: align,
        text_color: textColor,
        bg_color: null
      }]
    };
    await submitEditText(payload);
  });

  btnApplyFindReplace.addEventListener("click", async () => {
    const findText = document.getElementById("findText").value.trim();
    const replaceText = document.getElementById("replaceText").value;
    const scope = document.getElementById("replaceScope").value;
    const fontSize = parseFloat(document.getElementById("replaceFontSize").value) || null;
    const textColor = hexToRgb(document.getElementById("replaceTextColor").value);
    const bgColor = hexToRgb(document.getElementById("replaceBgColor").value);

    if (!findText) {
      showToast("Please enter text to find.", "error");
      return;
    }

    setLoading(true, "Replacing occurrences...");
    const payload = {
      edits: [{
        page: scope === "current" ? state.currentPage : 0,
        search_text: findText,
        new_text: replaceText,
        font_size: fontSize,
        text_color: textColor,
        bg_color: bgColor
      }]
    };
    await submitEditText(payload);
  });

  // 2. Add Point Text Annotation
  btnAddTextSubmit.addEventListener("click", async () => {
    const text = document.getElementById("newTextContent").value.trim();
    if (!text) {
      showToast("Please enter text to add.", "error");
      return;
    }

    const x = parseFloat(document.getElementById("newTextX").value) || 50;
    const y = parseFloat(document.getElementById("newTextY").value) || 100;
    const width = parseFloat(document.getElementById("newTextWidth").value) || null;
    const height = parseFloat(document.getElementById("newTextHeight").value) || null;
    const fontSize = parseFloat(document.getElementById("newTextFontSize").value) || 12;
    const color = hexToRgb(document.getElementById("newTextColor").value);
    const hasBox = newTextWithBox.checked;
    const bgColor = hasBox ? hexToRgb(document.getElementById("newTextBgColor").value) : null;

    setLoading(true, "Adding text to page...");
    const payload = {
      annotations: [{
        page: state.currentPage,
        x: x,
        y: y,
        text: text,
        font_size: fontSize,
        color: color,
        bg_color: bgColor,
        width: width,
        height: height
      }]
    };

    try {
      const res = await fetch(`/api/document/${state.docId}/add-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to add text");
      const data = await res.json();
      showToast("Text added successfully!", "success");
      await applyMutationResponse(data, state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // 3. Image Placement & Sidebar Dropzone
  const imageSidebarDropzone = document.getElementById("imageSidebarDropzone");
  const btnPasteFromClipboard = document.getElementById("btnPasteFromClipboard");

  if (imageSidebarDropzone && imagePlacementInput) {
    imageSidebarDropzone.addEventListener("click", () => {
      imagePlacementInput.click();
    });

    imageSidebarDropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      imageSidebarDropzone.classList.add("dragover");
    });

    imageSidebarDropzone.addEventListener("dragleave", () => {
      imageSidebarDropzone.classList.remove("dragover");
    });

    imageSidebarDropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      imageSidebarDropzone.classList.remove("dragover");
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageFileForPlacement(e.dataTransfer.files[0]);
      }
    });
  }

  if (imagePlacementInput) {
    imagePlacementInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageFileForPlacement(e.target.files[0]);
      }
    });
  }

  if (btnPasteFromClipboard) {
    btnPasteFromClipboard.addEventListener("click", async () => {
      try {
        if (navigator.clipboard && navigator.clipboard.read) {
          const items = await navigator.clipboard.read();
          for (const item of items) {
            const imageType = item.types.find(t => t.startsWith("image/"));
            if (imageType) {
              const blob = await item.getType(imageType);
              const file = new File([blob], "clipboard_image.png", { type: imageType });
              handleImageFileForPlacement(file);
              showToast("Pasted image from clipboard ready to place!", "success");
              return;
            }
          }
          showToast("No image found on clipboard. Press Ctrl+V to paste.", "info");
        } else {
          showToast("Press Ctrl+V anywhere on the page to paste clipboard image.", "info");
        }
      } catch (err) {
        showToast("Press Ctrl+V to paste image from clipboard.", "info");
      }
    });
  }

  const btnPlaceImageOnCanvas = document.getElementById("btnPlaceImageOnCanvas");
  if (btnPlaceImageOnCanvas) {
    btnPlaceImageOnCanvas.addEventListener("click", () => {
      const file = imagePlacementInput?.files?.[0];
      if (!file) {
        showToast("Please select or drop an image file first.", "error");
        return;
      }
      handleImageFileForPlacement(file);
    });
  }

  btnInsertImageSubmit.addEventListener("click", async () => {
    const file = imagePlacementInput.files[0];
    if (!file) {
      showToast("Please select an image file first.", "error");
      return;
    }

    const x0 = parseFloat(document.getElementById("imgX0").value) || 50;
    const y0 = parseFloat(document.getElementById("imgY0").value) || 100;
    const x1 = parseFloat(document.getElementById("imgX1").value) || 200;
    const y1 = parseFloat(document.getElementById("imgY1").value) || 200;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("page", state.currentPage);
    formData.append("x0", x0);
    formData.append("y0", y0);
    formData.append("x1", x1);
    formData.append("y1", y1);

    setLoading(true, "Placing image on page...");
    try {
      const res = await fetch(`/api/document/${state.docId}/insert-image`, {
        method: "POST",
        body: formData
      });
      if (!res.ok) throw new Error("Failed to place image");
      const data = await res.json();
      showToast("Image placed successfully!", "success");
      imagePlacementInput.value = "";
      imagePlacementPreview.style.display = "none";
      await applyMutationResponse(data, state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // 4. Shapes
  const btnApplyShape = document.getElementById("btnApplyShape");
  if (btnApplyShape) {
    btnApplyShape.addEventListener("click", async () => {
      if (activeTransformBox && activeTransformBox.classList.contains("mode-shape") && typeof activeTransformBox._commit === "function") {
        await activeTransformBox._commit();
        return;
      }
      const type = document.getElementById("shapeType").value;
      const color = hexToRgb(document.getElementById("shapeColor").value);
      const fillInput = document.getElementById("shapeFill").value;
      const fill_color = fillInput === "#ffffff" ? null : hexToRgb(fillInput);
      const width = parseFloat(document.getElementById("shapeWidth").value) || 2;

      const x1 = parseFloat(document.getElementById("shapeStartX").value);
      const y1 = parseFloat(document.getElementById("shapeStartY").value);
      const x2 = parseFloat(document.getElementById("shapeEndX").value);
      const y2 = parseFloat(document.getElementById("shapeEndY").value);

      if (isNaN(x1) || isNaN(y1) || isNaN(x2) || isNaN(y2)) {
        showToast("Please drag a shape on the canvas first.", "error");
        return;
      }

      const bbox = [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
      const points = [[x1, y1], [x2, y2]];

      setLoading(true, "Adding shape...");
      const payload = {
        shapes: [{
          page: state.currentPage,
          type: type,
          bbox: bbox,
          points: points,
          color: color,
          fill_color: fill_color,
          width: width
        }]
      };

      try {
        const res = await fetch(`/api/document/${state.docId}/add-shape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to add shape");
        const data = await res.json();
        showToast("Shape added!", "success");
        document.querySelectorAll(".shape-preview-box").forEach(b => b.remove());
        await applyMutationResponse(data, state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  // 5. AcroForms Actions & Builder Studio
  document.querySelectorAll(".palette-field-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const fType = btn.dataset.fieldType;
      if (state.formPlacementType === fType) {
        cancelFormPlacement();
        return;
      }
      state.formPlacementType = fType;
      document.querySelectorAll(".palette-field-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const hint = document.getElementById("formPlacementHint");
      const hintText = document.getElementById("placementHintText");
      if (hint && hintText) {
        const typeNames = {
          text: "Text Field",
          textarea: "Multi-line Text Area",
          checkbox: "Checkbox",
          combobox: "Dropdown List",
          radio: "Radio Option",
          signature: "Signature Area"
        };
        hintText.textContent = `Click anywhere on PDF page to place ${typeNames[fType] || fType}`;
        hint.style.display = "flex";
      }
      interactiveOverlay.style.cursor = "crosshair";
      showToast(`Click anywhere on page to place ${fType} field.`, "info");
    });
  });

  const btnCancelPlacement = document.getElementById("btnCancelPlacement");
  if (btnCancelPlacement) {
    btnCancelPlacement.addEventListener("click", () => {
      cancelFormPlacement();
    });
  }

  const btnApplyFieldProps = document.getElementById("btnApplyFieldProps");
  if (btnApplyFieldProps) {
    btnApplyFieldProps.addEventListener("click", applyFieldProps);
  }

  const btnDeleteSelectedField = document.getElementById("btnDeleteSelectedField");
  if (btnDeleteSelectedField) {
    btnDeleteSelectedField.addEventListener("click", deleteSelectedField);
  }

  if (btnSaveFormValues) {
    btnSaveFormValues.addEventListener("click", async () => {
      const inputs = document.querySelectorAll(".form-field-input-control");
      const values = {};
      inputs.forEach(input => {
        const fieldName = input.dataset.fieldName;
        if (input.type === "checkbox" || input.type === "radio") {
          values[fieldName] = input.checked;
        } else {
          values[fieldName] = input.value;
        }
      });

      setLoading(true, "Saving form values...");
      try {
        const res = await fetch(`/api/document/${state.docId}/fill-forms`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: values })
        });
        if (!res.ok) throw new Error("Failed to save form values");
        showToast("Form values saved!", "success");
        updateUndoRedoButtons(true, false);
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  const btnExportFormJson = document.getElementById("btnExportFormJson");
  if (btnExportFormJson) {
    btnExportFormJson.addEventListener("click", async () => {
      if (!state.docId) return;
      setLoading(true, "Exporting form data...");
      try {
        const res = await fetch(`/api/document/${state.docId}/forms/export-json`);
        if (!res.ok) throw new Error("Failed to export form data");
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        downloadBlob(blob, `form_data_${state.filename || "doc"}.json`);
        showToast("Form data exported to JSON!", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  const btnTriggerImportJson = document.getElementById("btnTriggerImportJson");
  const importJsonFileInput = document.getElementById("importJsonFileInput");
  if (btnTriggerImportJson && importJsonFileInput) {
    btnTriggerImportJson.addEventListener("click", () => {
      importJsonFileInput.click();
    });

    importJsonFileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (re) => {
        try {
          const jsonData = JSON.parse(re.target.result);
          setLoading(true, "Importing form data...");
          const res = await fetch(`/api/document/${state.docId}/forms/import-json`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: jsonData })
          });
          if (!res.ok) throw new Error("Failed to import form data");
          showToast("Form data imported successfully!", "success");
          updateUndoRedoButtons(true, false);
          await loadPage(state.currentPage);
          await loadFormFields();
        } catch (err) {
          showToast("Import error: " + err.message, "error");
        } finally {
          importJsonFileInput.value = "";
          setLoading(false);
        }
      };
      reader.readAsText(file);
    });
  }

  const btnClearFormValues = document.getElementById("btnClearFormValues");
  if (btnClearFormValues) {
    btnClearFormValues.addEventListener("click", () => {
      showConfirmModal("Clear All Fields", "Clear all form field values across the entire document?", async () => {
        setLoading(true, "Clearing form fields...");
        try {
          const res = await fetch(`/api/document/${state.docId}/forms/clear`, { method: "POST" });
          if (!res.ok) throw new Error("Failed to clear form fields");
          showToast("All form field values cleared!", "success");
          updateUndoRedoButtons(true, false);
          await loadPage(state.currentPage);
          await loadFormFields();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      });
    });
  }

  if (btnFlattenForms) {
    btnFlattenForms.addEventListener("click", () => {
      showConfirmModal("Flatten Forms", "Flatten all interactive form fields into static text? This action cannot be unflattened.", async () => {
        setLoading(true, "Flattening forms...");
        try {
          const res = await fetch(`/api/document/${state.docId}/forms/flatten`, { method: "POST" });
          if (!res.ok) throw new Error("Failed to flatten forms");
          showToast("Forms flattened into static content!", "success");
          updateUndoRedoButtons(true, false);
          await loadPage(state.currentPage);
          await loadFormFields();
        } catch (err) {
          showToast(err.message, "error");
        } finally {
          setLoading(false);
        }
      });
    });
  }

  // 6. Redaction
  btnApplyVisualRedact.addEventListener("click", async () => {
    const redactBox = interactiveOverlay.querySelector(".redact-preview-box");
    if (!redactBox) {
      showToast("Please drag a rectangle on the document preview to mark redactions.", "error");
      return;
    }

    const rect = interactiveOverlay.getBoundingClientRect();
    const scaleX = state.pageWidthPt / rect.width;
    const scaleY = state.pageHeightPt / rect.height;

    const pxLeft = parseFloat(redactBox.style.left);
    const pxTop = parseFloat(redactBox.style.top);
    const pxWidth = parseFloat(redactBox.style.width);
    const pxHeight = parseFloat(redactBox.style.height);

    const x0 = pxLeft * scaleX;
    const y0 = pxTop * scaleY;
    const x1 = (pxLeft + pxWidth) * scaleX;
    const y1 = (pxTop + pxHeight) * scaleY;

    const reason = document.getElementById("redactReason").value.trim();
    const fillColor = hexToRgb(document.getElementById("redactFillColor").value);
    const textColor = hexToRgb(document.getElementById("redactTextColor").value);

    setLoading(true, "Applying permanent redaction...");
    const payload = {
      redactions: [{
        page: state.currentPage,
        bbox: [x0, y0, x1, y1],
        text: reason,
        fill_color: fillColor,
        text_color: textColor
      }]
    };

    try {
      const res = await fetch(`/api/document/${state.docId}/redact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to apply redactions");
      showToast("Redaction permanently applied!", "success");
      redactBox.remove();
      updateUndoRedoButtons(true, false);
      await loadPage(state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  btnSanitizeDoc.addEventListener("click", () => {
    showConfirmModal("Sanitize Document", "Sanitize document to purge metadata, embedded attachments, and links? This ensures zero sensitive data leaks.", async () => {
      setLoading(true, "Sanitizing document...");
      try {
        const res = await fetch(`/api/document/${state.docId}/sanitize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            remove_metadata: true,
            remove_attachments: true,
            remove_links: true
          })
        });
        if (!res.ok) throw new Error("Failed to sanitize");
        showToast("Document sanitized!", "success");
        updateUndoRedoButtons(true, false);
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  });

  // 7. Watermark
  if (watermarkOpacity && watermarkOpacityVal) {
    watermarkOpacity.addEventListener("input", (e) => {
      watermarkOpacityVal.textContent = `${e.target.value}%`;
    });
  }

  btnApplyWatermark.addEventListener("click", async () => {
    const text = document.getElementById("watermarkText").value.trim();
    if (!text) {
      showToast("Please enter watermark text.", "error");
      return;
    }

    const angle = parseFloat(document.getElementById("watermarkAngle").value) || 45;
    const size = parseFloat(document.getElementById("watermarkSize").value) || 48;
    const color = hexToRgb(document.getElementById("watermarkColor").value);
    const scope = document.getElementById("watermarkScope").value;
    const opacity = (parseFloat(document.getElementById("watermarkOpacity").value) || 30) / 100.0;

    setLoading(true, "Applying watermark...");
    const payload = {
      text: text,
      rotation_angle: angle,
      font_size: size,
      color: color,
      opacity: opacity,
      page_numbers: scope === "current" ? [state.currentPage] : null
    };

    try {
      const res = await fetch(`/api/document/${state.docId}/watermark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to apply watermark");
      showToast("Watermark applied!", "success");
      updateUndoRedoButtons(true, false);
      await loadPage(state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // 8. Page Numbering
  if (btnApplyPageNumbers) {
    btnApplyPageNumbers.addEventListener("click", async () => {
      const position = document.getElementById("pageNumberPosition").value;
      const formatStr = document.getElementById("pageNumberFormat").value.trim();
      const startPage = parseInt(document.getElementById("pageNumberStart").value) || 1;
      const fontSize = parseFloat(document.getElementById("pageNumberFontSize").value) || 10;
      const fontName = document.getElementById("pageNumberFont").value;
      const color = hexToRgb(document.getElementById("pageNumberColor").value);

      setLoading(true, "Applying page numbering...");
      const payload = {
        position: position,
        format_str: formatStr,
        start_page: startPage,
        font_size: fontSize,
        font_name: fontName,
        color: color,
        margin: 36.0
      };

      try {
        const res = await fetch(`/api/document/${state.docId}/page-numbers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Failed to apply page numbers");
        showToast("Page numbers applied!", "success");
        updateUndoRedoButtons(true, false);
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  // 9. Page Operations (Rotate, Delete, Duplicate, Insert Blank)
  btnRotateLeft.addEventListener("click", async () => rotateCurrentPage(270));
  btnRotateRight.addEventListener("click", async () => rotateCurrentPage(90));

  btnDeleteCurrentPage.addEventListener("click", async () => {
    if (state.totalPages <= 1) {
      showToast("Cannot delete the only page in document.", "error");
      return;
    }
    showConfirmModal("Delete Page", `Delete Page ${state.currentPage} from document?`, async () => {
      const remainingPages = [];
      for (let i = 1; i <= state.totalPages; i++) {
        if (i !== state.currentPage) remainingPages.push(i);
      }
      await applyPageOrder(remainingPages);
    });
  });

  btnDuplicatePage.addEventListener("click", async () => duplicateCurrentPage());
  if (btnThumbDuplicate) btnThumbDuplicate.addEventListener("click", async () => duplicateCurrentPage());

  btnInsertBlankPageSubmit.addEventListener("click", async () => {
    const at = parseInt(document.getElementById("insertBlankAt").value) || 1;
    const size = document.getElementById("insertBlankSize").value;
    let w = 595.0, h = 842.0;
    if (size === "letter") { w = 612.0; h = 792.0; }
    if (size === "legal") { w = 612.0; h = 1008.0; }

    setLoading(true, "Inserting blank page...");
    try {
      const res = await fetch(`/api/document/${state.docId}/page/insert-blank`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ at_page: at, width: w, height: h })
      });
      if (!res.ok) throw new Error("Insert blank failed");
      const data = await res.json();
      state.docInfo = data.info;
      state.totalPages = data.info.page_count;
      totalPagesSpan.textContent = state.totalPages;
      pageNumberInput.max = state.totalPages;
      updateUndoRedoButtons(true, false);
      updatePageOrderInput();
      populateThumbnails();
      showToast("Blank page inserted!", "success");
      await loadPage(at);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  if (btnThumbInsertBlank) {
    btnThumbInsertBlank.addEventListener("click", () => {
      document.querySelector('[data-tab="tab-organize"]').click();
      document.getElementById("insertBlankAt").value = state.currentPage;
      btnInsertBlankPageSubmit.click();
    });
  }

  btnApplyPageOrder.addEventListener("click", async () => {
    const raw = customPageOrder.value;
    const parts = raw.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= state.totalPages);
    if (parts.length === 0) {
      showToast("Please enter a valid list of page numbers.", "error");
      return;
    }
    await applyPageOrder(parts);
  });

  // ==========================================================================
  // B5. Split PDF — Visual Page Picker & Extraction Engine
  // ==========================================================================

  const splitState = {
    selectedPages: new Set(),
    lastClickedPage: null
  };

  /**
   * Compacts a Set or Array of page numbers into a sorted range string (e.g. "1-3, 5, 8-10").
   */
  function formatSelectedPagesToRangeString(pageNumbers) {
    if (!pageNumbers) return "";
    const nums = Array.from(pageNumbers).map(Number).filter(n => !isNaN(n) && n > 0);
    if (nums.length === 0) return "";
    nums.sort((a, b) => a - b);
    const unique = Array.from(new Set(nums));
    const ranges = [];
    let start = unique[0];
    let prev = unique[0];

    for (let i = 1; i < unique.length; i++) {
      const cur = unique[i];
      if (cur === prev + 1) {
        prev = cur;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = cur;
        prev = cur;
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
    return ranges.join(", ");
  }

  /**
   * Parses a range string like "1-3, 5, 8-10" into a Set of valid page numbers clamped to [1, totalPages].
   * Gracefully handles reversed ranges (e.g. "5-2"), non-numeric tokens, and typing states.
   */
  function parseRangeStringToPageSet(rangeStr, totalPages = (state.totalPages || 1)) {
    const result = new Set();
    if (!rangeStr || typeof rangeStr !== "string") return result;

    const parts = rangeStr.split(",");
    for (const part of parts) {
      const token = part.trim();
      if (!token) continue;

      if (token.includes("-")) {
        const sub = token.split("-");
        if (sub.length === 2) {
          const s = parseInt(sub[0].trim(), 10);
          const e = parseInt(sub[1].trim(), 10);
          if (!isNaN(s) && !isNaN(e) && s > 0 && e > 0) {
            const low = Math.max(1, Math.min(s, e));
            const high = Math.min(totalPages, Math.max(s, e));
            for (let p = low; p <= high; p++) {
              result.add(p);
            }
          }
        }
      } else {
        const n = parseInt(token, 10);
        if (!isNaN(n) && n >= 1 && n <= totalPages) {
          result.add(n);
        }
      }
    }
    return result;
  }

  function updateSplitCardSelectedClasses() {
    // Sidebar cards
    const sidebarCards = document.querySelectorAll("#splitSidebarGrid .split-card");
    sidebarCards.forEach(card => {
      const p = parseInt(card.dataset.page, 10);
      if (splitState.selectedPages.has(p)) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });

    // Modal cards
    const modalCards = document.querySelectorAll("#splitModalCardsGrid .split-modal-card");
    modalCards.forEach(card => {
      const p = parseInt(card.dataset.page, 10);
      if (splitState.selectedPages.has(p)) {
        card.classList.add("selected");
      } else {
        card.classList.remove("selected");
      }
    });
  }

  function updateSplitSummaryText() {
    const count = splitState.selectedPages.size;
    const total = state.totalPages || 0;
    const summaryEl = document.getElementById("splitSelectionSummary");
    const modalBadge = document.getElementById("splitModalStatsBadge");
    const text = `${count} of ${total} page${total === 1 ? "" : "s"} selected`;
    if (summaryEl) summaryEl.textContent = text;
    if (modalBadge) modalBadge.textContent = text;
  }

  function syncSplitFromSelection() {
    const rangeStr = formatSelectedPagesToRangeString(splitState.selectedPages);

    const sidebarInput = document.getElementById("splitRangeInput");
    const modalInput = document.getElementById("splitModalRangeInput");
    if (sidebarInput && document.activeElement !== sidebarInput) {
      sidebarInput.value = rangeStr;
    }
    if (modalInput && document.activeElement !== modalInput) {
      modalInput.value = rangeStr;
    }

    updateSplitCardSelectedClasses();
    updateSplitSummaryText();
  }

  function handleSplitRangeInput(sourceInput) {
    if (!sourceInput) return;
    const text = sourceInput.value;
    splitState.selectedPages = parseRangeStringToPageSet(text, state.totalPages || 1);

    const sidebarInput = document.getElementById("splitRangeInput");
    const modalInput = document.getElementById("splitModalRangeInput");
    if (sourceInput === sidebarInput && modalInput) {
      modalInput.value = text;
    } else if (sourceInput === modalInput && sidebarInput) {
      sidebarInput.value = text;
    }

    updateSplitCardSelectedClasses();
    updateSplitSummaryText();
  }

  function handleSplitPageClick(pageNumber, isShift = false) {
    if (!pageNumber || pageNumber < 1 || pageNumber > state.totalPages) return;

    if (isShift && splitState.lastClickedPage !== null) {
      const min = Math.min(splitState.lastClickedPage, pageNumber);
      const max = Math.max(splitState.lastClickedPage, pageNumber);
      const shouldSelect = !splitState.selectedPages.has(pageNumber);
      for (let p = min; p <= max; p++) {
        if (shouldSelect) {
          splitState.selectedPages.add(p);
        } else {
          splitState.selectedPages.delete(p);
        }
      }
    } else {
      if (splitState.selectedPages.has(pageNumber)) {
        splitState.selectedPages.delete(pageNumber);
      } else {
        splitState.selectedPages.add(pageNumber);
      }
      splitState.lastClickedPage = pageNumber;
    }

    syncSplitFromSelection();
  }

  function renderSplitSidebar() {
    const grid = document.getElementById("splitSidebarGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.docId || state.totalPages < 1) {
      grid.innerHTML = `
        <div class="empty-queue-placeholder" id="splitEmptySidebarState" style="text-align: center; padding: 24px 10px; color: var(--text-muted); font-size: 11.5px; grid-column: 1 / -1;">
          No active document loaded.<br>Open a PDF to select pages.
        </div>`;
      updateSplitSummaryText();
      return;
    }

    for (let p = 1; p <= state.totalPages; p++) {
      const card = document.createElement("div");
      card.className = "split-card";
      card.dataset.page = p;
      if (splitState.selectedPages.has(p)) card.classList.add("selected");
      card.title = `Page ${p} (Click to toggle, Shift+click for range)`;

      const check = document.createElement("div");
      check.className = "split-card-check";
      check.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      const thumb = document.createElement("div");
      thumb.className = "split-card-thumb";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `P.${p}`;
      img.src = `/api/document/${state.docId}/page/${p}/image?zoom=0.2&format=jpeg&v=${state.docVersion || 1}`;
      thumb.appendChild(img);

      const num = document.createElement("div");
      num.className = "split-card-num";
      num.textContent = `Page ${p}`;

      card.appendChild(check);
      card.appendChild(thumb);
      card.appendChild(num);

      card.addEventListener("click", (e) => {
        handleSplitPageClick(p, e.shiftKey);
      });

      grid.appendChild(card);
    }

    updateSplitSummaryText();
  }

  function renderSplitModal() {
    const grid = document.getElementById("splitModalCardsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    if (!state.docId || state.totalPages < 1) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 40px 10px; color: var(--text-muted); font-size: 13px;">
          No active document loaded. Please open a PDF document first.
        </div>`;
      updateSplitSummaryText();
      return;
    }

    for (let p = 1; p <= state.totalPages; p++) {
      const card = document.createElement("div");
      card.className = "split-modal-card";
      card.dataset.page = p;
      if (splitState.selectedPages.has(p)) card.classList.add("selected");
      card.title = `Page ${p} (Click to toggle, Shift+click for range)`;

      const check = document.createElement("div");
      check.className = "split-card-check";
      check.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

      const thumb = document.createElement("div");
      thumb.className = "split-modal-thumb";
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = `Page ${p}`;
      img.src = `/api/document/${state.docId}/page/${p}/image?zoom=0.28&format=jpeg&v=${state.docVersion || 1}`;
      thumb.appendChild(img);

      const footer = document.createElement("div");
      footer.className = "split-modal-footer";
      const num = document.createElement("div");
      num.className = "split-modal-num";
      num.textContent = `Page ${p}`;
      footer.appendChild(num);

      card.appendChild(check);
      card.appendChild(thumb);
      card.appendChild(footer);

      card.addEventListener("click", (e) => {
        handleSplitPageClick(p, e.shiftKey);
      });

      grid.appendChild(card);
    }

    updateSplitSummaryText();
  }

  function renderSplitViews() {
    if (state.totalPages && state.totalPages > 0) {
      // Clamp any selected pages to active document total
      for (const p of Array.from(splitState.selectedPages)) {
        if (p > state.totalPages || p < 1) {
          splitState.selectedPages.delete(p);
        }
      }
    }
    renderSplitSidebar();
    renderSplitModal();
    syncSplitFromSelection();
  }

  window.openSplitModal = function() {
    if (!state.docId) {
      showToast("Please open a PDF file to select and extract pages.", "info");
      if (pdfFileInput) {
        const originalOnChange = pdfFileInput.onchange;
        pdfFileInput.onchange = async (e) => {
          pdfFileInput.onchange = originalOnChange;
          const file = e.target.files && e.target.files[0];
          if (file) {
            await handlePdfUpload(file);
            const splitTab = document.querySelector('[data-tab="tab-split"]');
            if (splitTab) splitTab.click();
            renderSplitViews();
            openModal("splitStudioModal");
          }
        };
        pdfFileInput.click();
      }
      return;
    }
    renderSplitViews();
    openModal("splitStudioModal");
  };

  async function executeSplitExtract(mode = "single", openInStudio = false) {
    if (!state.docId) {
      showToast("No active document loaded.", "error");
      return;
    }

    const rangeInput = document.getElementById("splitRangeInput");
    let rangeStr = formatSelectedPagesToRangeString(splitState.selectedPages);
    if (!rangeStr && rangeInput && rangeInput.value.trim()) {
      rangeStr = rangeInput.value.trim();
    }

    if (!rangeStr) {
      showToast("Please select at least one page to extract.", "warning");
      return;
    }

    // Determine output filename
    const filenameInput = document.getElementById(openInStudio ? "splitModalOutputFilename" : "splitOutputFilename")
      || document.getElementById("splitOutputFilename");
    let outName = (filenameInput && filenameInput.value.trim()) || `extracted_${state.filename || "document.pdf"}`;
    if (!outName.toLowerCase().endsWith(".pdf")) outName += ".pdf";

    if (mode === "zip") {
      setLoading(true, "Extracting selected pages to ZIP archive...");
      try {
        const res = await fetch(`/api/document/${state.docId}/extract-zip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page_ranges: rangeStr, prefix: "extracted_page" })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "ZIP Extraction failed");
        }
        const blob = await res.blob();
        const baseDoc = (state.filename || "document").replace(/\.pdf$/i, "");
        downloadBlob(blob, `extracted_${baseDoc}_pages.zip`);
        closeModal("splitStudioModal");
        showToast("Extracted pages downloaded as ZIP archive!", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
      return;
    }

    // Single PDF extraction
    setLoading(true, openInStudio ? "Extracting pages & loading studio..." : "Extracting pages to PDF...");
    try {
      const res = await fetch(`/api/document/${state.docId}/split`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page_ranges: rangeStr, output_filename: outName })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Split extraction failed");
      }
      const blob = await res.blob();

      if (openInStudio) {
        closeModal("splitStudioModal");
        const extractedFile = new File([blob], outName, { type: "application/pdf" });
        await handlePdfUpload(extractedFile);
        showToast("Extracted pages opened in PDF Studio!", "success");
      } else {
        closeModal("splitStudioModal");
        downloadBlob(blob, outName);
        showToast("Extracted PDF downloaded successfully!", "success");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  // Attach Split Event Listeners
  const btnOpenSplitModal = document.getElementById("btnOpenSplitModal");
  if (btnOpenSplitModal) {
    btnOpenSplitModal.addEventListener("click", () => window.openSplitModal());
  }

  // Shortcut buttons - Sidebar
  const btnSplitSelectAll = document.getElementById("btnSplitSelectAll");
  if (btnSplitSelectAll) {
    btnSplitSelectAll.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 1; p <= state.totalPages; p++) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnSplitSelectNone = document.getElementById("btnSplitSelectNone");
  if (btnSplitSelectNone) {
    btnSplitSelectNone.addEventListener("click", () => {
      splitState.selectedPages.clear();
      syncSplitFromSelection();
    });
  }

  const btnSplitSelectOdd = document.getElementById("btnSplitSelectOdd");
  if (btnSplitSelectOdd) {
    btnSplitSelectOdd.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 1; p <= state.totalPages; p += 2) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnSplitSelectEven = document.getElementById("btnSplitSelectEven");
  if (btnSplitSelectEven) {
    btnSplitSelectEven.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 2; p <= state.totalPages; p += 2) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnSplitInvert = document.getElementById("btnSplitInvert");
  if (btnSplitInvert) {
    btnSplitInvert.addEventListener("click", () => {
      const next = new Set();
      for (let p = 1; p <= state.totalPages; p++) {
        if (!splitState.selectedPages.has(p)) next.add(p);
      }
      splitState.selectedPages = next;
      syncSplitFromSelection();
    });
  }

  // Shortcut buttons - Modal
  const btnModalSplitSelectAll = document.getElementById("btnModalSplitSelectAll");
  if (btnModalSplitSelectAll) {
    btnModalSplitSelectAll.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 1; p <= state.totalPages; p++) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnModalSplitSelectNone = document.getElementById("btnModalSplitSelectNone");
  if (btnModalSplitSelectNone) {
    btnModalSplitSelectNone.addEventListener("click", () => {
      splitState.selectedPages.clear();
      syncSplitFromSelection();
    });
  }

  const btnModalSplitSelectOdd = document.getElementById("btnModalSplitSelectOdd");
  if (btnModalSplitSelectOdd) {
    btnModalSplitSelectOdd.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 1; p <= state.totalPages; p += 2) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnModalSplitSelectEven = document.getElementById("btnModalSplitSelectEven");
  if (btnModalSplitSelectEven) {
    btnModalSplitSelectEven.addEventListener("click", () => {
      splitState.selectedPages.clear();
      for (let p = 2; p <= state.totalPages; p += 2) splitState.selectedPages.add(p);
      syncSplitFromSelection();
    });
  }

  const btnModalSplitInvert = document.getElementById("btnModalSplitInvert");
  if (btnModalSplitInvert) {
    btnModalSplitInvert.addEventListener("click", () => {
      const next = new Set();
      for (let p = 1; p <= state.totalPages; p++) {
        if (!splitState.selectedPages.has(p)) next.add(p);
      }
      splitState.selectedPages = next;
      syncSplitFromSelection();
    });
  }

  // Inputs live sync
  const splitRangeInput = document.getElementById("splitRangeInput");
  if (splitRangeInput) {
    splitRangeInput.addEventListener("input", () => handleSplitRangeInput(splitRangeInput));
  }

  const splitModalRangeInput = document.getElementById("splitModalRangeInput");
  if (splitModalRangeInput) {
    splitModalRangeInput.addEventListener("input", () => handleSplitRangeInput(splitModalRangeInput));
  }

  // Extraction action triggers
  if (btnSplitRange) {
    btnSplitRange.addEventListener("click", () => executeSplitExtract("single", false));
  }

  const btnSplitOpenStudio = document.getElementById("btnSplitOpenStudio");
  if (btnSplitOpenStudio) {
    btnSplitOpenStudio.addEventListener("click", () => executeSplitExtract("single", true));
  }

  const btnExtractZip = document.getElementById("btnExtractZip");
  if (btnExtractZip) {
    btnExtractZip.addEventListener("click", () => executeSplitExtract("zip", false));
  }

  const btnModalSplitDownload = document.getElementById("btnModalSplitDownload");
  if (btnModalSplitDownload) {
    btnModalSplitDownload.addEventListener("click", () => executeSplitExtract("single", false));
  }

  const btnModalSplitOpen = document.getElementById("btnModalSplitOpen");
  if (btnModalSplitOpen) {
    btnModalSplitOpen.addEventListener("click", () => executeSplitExtract("single", true));
  }

  const btnModalExtractZip = document.getElementById("btnModalExtractZip");
  if (btnModalExtractZip) {
    btnModalExtractZip.addEventListener("click", () => executeSplitExtract("zip", false));
  }

  if (btnBurstZip) {
    btnBurstZip.addEventListener("click", async () => {
      if (!state.docId) {
        showToast("No active document loaded.", "error");
        return;
      }
      setLoading(true, "Bursting all pages to ZIP...");
      try {
        const res = await fetch(`/api/document/${state.docId}/burst`);
        if (!res.ok) throw new Error("Burst failed");
        const blob = await res.blob();
        downloadBlob(blob, `burst_${state.filename || "document"}.zip`);
        showToast("Burst ZIP downloaded successfully!", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  // ==========================================================================
  // B4. Merge PDFs - Visual Organizer & Interactive Reorder Engine
  // ==========================================================================

  const mergeState = {
    files: [], // Array of { id, file, filename, size, pageCount, thumbnail, rotation, isCurrentDoc }
    draggedIndex: null,
    modalDraggedIndex: null
  };

  function formatMergeBytes(bytes) {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  }

  function getMergeTotalPages() {
    return mergeState.files.reduce((sum, f) => sum + (f.pageCount || 1), 0);
  }

  function getMergeTotalSize() {
    return mergeState.files.reduce((sum, f) => sum + (f.size || 0), 0);
  }

  function updateMergeSummaries() {
    const totalFiles = mergeState.files.length;
    const totalPages = getMergeTotalPages();
    const totalBytes = getMergeTotalSize();

    // Sidebar summary
    const summaryEl = document.getElementById("mergeQueueSummary");
    const summaryText = document.getElementById("mergeSummaryText");
    const summarySize = document.getElementById("mergeSummarySize");
    const emptyState = document.getElementById("mergeEmptyQueueState");

    if (summaryEl && summaryText && summarySize) {
      if (totalFiles > 0) {
        summaryEl.style.display = "flex";
        summaryText.textContent = `${totalFiles} file${totalFiles > 1 ? "s" : ""} • ${totalPages} total page${totalPages > 1 ? "s" : ""}`;
        summarySize.textContent = formatMergeBytes(totalBytes);
        if (emptyState) emptyState.style.display = "none";
      } else {
        summaryEl.style.display = "none";
        if (emptyState) emptyState.style.display = "block";
      }
    }

    // Modal stats badge
    const modalStats = document.getElementById("mergeModalStatsBadge");
    if (modalStats) {
      modalStats.textContent = totalFiles > 0
        ? `${totalFiles} files • ${totalPages} pages • ${formatMergeBytes(totalBytes)}`
        : "0 files queued";
    }
  }

  async function inspectAndQueuePdfFiles(files) {
    if (!files || files.length === 0) return;
    const filesArray = Array.from(files);
    let addedCount = 0;

    setLoading(true, "Inspecting PDF documents...");
    try {
      for (const file of filesArray) {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
          showToast(`Skipped "${file.name}" (not a PDF).`, "warning");
          continue;
        }

        try {
          const formData = new FormData();
          formData.append("file", file);
          const res = await fetch("/api/pdf-inspect", { method: "POST", body: formData });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            showToast(`Could not inspect "${file.name}": ${errData.detail || "Invalid PDF"}`, "error");
            continue;
          }
          const info = await res.json();
          if (info.is_encrypted) {
            showToast(`"${file.name}" is password-protected. Please unlock it before merging.`, "error");
            continue;
          }

          mergeState.files.push({
            id: "merge-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
            file: file,
            filename: file.name,
            size: file.size,
            pageCount: info.page_count || 1,
            thumbnail: info.thumbnail || null,
            rotation: 0,
            isCurrentDoc: false
          });
          addedCount++;
        } catch (err) {
          showToast(`Error processing "${file.name}": ${err.message}`, "error");
        }
      }

      if (addedCount > 0) {
        renderMergeViews();
        showToast(`Added ${addedCount} PDF file${addedCount > 1 ? "s" : ""} to merge queue.`, "success");
      }
    } finally {
      setLoading(false);
      if (mergeFileInput) mergeFileInput.value = "";
    }
  }

  let isAddingActiveDoc = false;
  function addActiveDocumentToMergeQueue() {
    if (!state.docId) {
      showToast("No active document is currently loaded in PDF Studio.", "warning");
      return;
    }

    if (isAddingActiveDoc) return;
    isAddingActiveDoc = true;
    setTimeout(() => { isAddingActiveDoc = false; }, 350);

    const alreadyInQueue = mergeState.files.some(f => f.isCurrentDoc && f.docId === state.docId);
    if (alreadyInQueue) {
      showToast("Active document is already in the merge queue.", "info");
      return;
    }

    const fname = (state.docInfo && state.docInfo.filename) || (document.getElementById("activeFilename")?.textContent) || "document.pdf";
    const cleanName = fname.replace(" (Active)", "").trim();
    const thumbUrl = `/api/document/${state.docId}/page/1/image?zoom=0.25&format=jpeg&v=${state.docVersion || 1}`;

    const queueItem = {
      id: "active-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
      docId: state.docId,
      file: null, // Asynchronously loaded in background
      filename: cleanName + " (Active)",
      size: state.fileSize || 0,
      pageCount: state.totalPages || (state.docInfo && state.docInfo.page_count) || 1,
      thumbnail: thumbUrl,
      rotation: 0,
      isCurrentDoc: true,
      readyPromise: null
    };

    // Instant non-blocking addition to merge queue (0ms UI latency)
    mergeState.files.push(queueItem);
    renderMergeViews();
    showToast(`Added active document "${cleanName}" to merge queue!`, "success");

    // Pre-fetch document binary in background so merge submission is instant
    queueItem.readyPromise = fetch(`/api/document/${state.docId}/download`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to download active document");
        return res.blob();
      })
      .then(blob => {
        queueItem.file = new File([blob], cleanName, { type: "application/pdf" });
        if (!queueItem.size) queueItem.size = blob.size;
        updateMergeSummaries();
      })
      .catch(err => {
        console.warn("Background fetch of active PDF blob:", err);
      });
  }

  function renderMergeSidebar() {
    if (!mergeFileList) return;
    mergeFileList.innerHTML = "";

    if (mergeState.files.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-queue-placeholder";
      emptyDiv.id = "mergeEmptyQueueState";
      emptyDiv.style.textAlign = "center";
      emptyDiv.style.padding = "20px 10px";
      emptyDiv.style.color = "var(--text-muted)";
      emptyDiv.style.fontSize = "12px";
      emptyDiv.style.border = "1px dashed var(--border-color)";
      emptyDiv.style.borderRadius = "var(--radius-sm)";
      emptyDiv.innerHTML = "No PDF files queued yet.<br>Add 2 or more files above to merge.";
      mergeFileList.appendChild(emptyDiv);
      updateMergeSummaries();
      return;
    }

    mergeState.files.forEach((f, idx) => {
      const card = document.createElement("div");
      card.className = "merge-card";
      card.draggable = true;
      card.dataset.index = idx;

      // Card drag and drop
      card.addEventListener("dragstart", (e) => {
        mergeState.draggedIndex = idx;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", idx);
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        card.classList.add("drag-over");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const fromIdx = mergeState.draggedIndex;
        if (fromIdx !== null && fromIdx !== idx) {
          moveMergeItem(fromIdx, idx);
        }
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".merge-card").forEach(c => c.classList.remove("drag-over"));
        mergeState.draggedIndex = null;
      });

      // Drag Handle
      const dragHandle = document.createElement("div");
      dragHandle.className = "merge-card-drag-handle";
      dragHandle.title = "Drag to reorder";
      dragHandle.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>`;

      // Position Index
      const indexBadge = document.createElement("div");
      indexBadge.className = "merge-card-index";
      indexBadge.textContent = `#${idx + 1}`;

      // Thumbnail
      const thumbWrap = document.createElement("div");
      thumbWrap.className = "merge-card-thumb";
      if (f.thumbnail) {
        const img = document.createElement("img");
        img.src = f.thumbnail;
        img.alt = f.filename;
        if (f.rotation) img.style.transform = `rotate(${f.rotation}deg)`;
        thumbWrap.appendChild(img);
      } else {
        thumbWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>`;
      }
      const pageBadge = document.createElement("span");
      pageBadge.className = "page-badge";
      pageBadge.textContent = `${f.pageCount}p`;
      thumbWrap.appendChild(pageBadge);

      // Info
      const infoWrap = document.createElement("div");
      infoWrap.className = "merge-card-info";
      const nameEl = document.createElement("span");
      nameEl.className = "name";
      nameEl.textContent = f.filename;
      nameEl.title = f.filename;
      const metaEl = document.createElement("div");
      metaEl.className = "meta";
      metaEl.innerHTML = `<span>${formatMergeBytes(f.size)}</span>`;
      if (f.rotation) {
        metaEl.innerHTML += `<span class="rot-pill">${f.rotation}°</span>`;
      }
      infoWrap.appendChild(nameEl);
      infoWrap.appendChild(metaEl);

      // Actions
      const actionsWrap = document.createElement("div");
      actionsWrap.className = "merge-card-actions";

      // Rotate
      const btnRot = document.createElement("button");
      btnRot.type = "button";
      btnRot.title = "Rotate 90° clockwise";
      btnRot.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`;
      btnRot.addEventListener("click", (e) => {
        e.stopPropagation();
        f.rotation = (f.rotation + 90) % 360;
        renderMergeViews();
      });

      // Move Up
      const btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.title = "Move Up";
      btnUp.disabled = idx === 0;
      btnUp.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>`;
      btnUp.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx > 0) moveMergeItem(idx, idx - 1);
      });

      // Move Down
      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.title = "Move Down";
      btnDown.disabled = idx === mergeState.files.length - 1;
      btnDown.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>`;
      btnDown.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx < mergeState.files.length - 1) moveMergeItem(idx, idx + 1);
      });

      // Remove
      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "btn-remove";
      btnRemove.title = "Remove from queue";
      btnRemove.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
      btnRemove.addEventListener("click", (e) => {
        e.stopPropagation();
        mergeState.files.splice(idx, 1);
        renderMergeViews();
      });

      actionsWrap.appendChild(btnRot);
      actionsWrap.appendChild(btnUp);
      actionsWrap.appendChild(btnDown);
      actionsWrap.appendChild(btnRemove);

      card.appendChild(dragHandle);
      card.appendChild(indexBadge);
      card.appendChild(thumbWrap);
      card.appendChild(infoWrap);
      card.appendChild(actionsWrap);
      mergeFileList.appendChild(card);
    });

    updateMergeSummaries();
  }

  function renderMergeModal() {
    const grid = document.getElementById("mergeModalCardsGrid");
    if (!grid) return;
    grid.innerHTML = "";

    mergeState.files.forEach((f, idx) => {
      const card = document.createElement("div");
      card.className = "merge-grid-card";
      card.draggable = true;
      card.dataset.index = idx;

      // Drag and drop in grid
      card.addEventListener("dragstart", (e) => {
        mergeState.modalDraggedIndex = idx;
        card.classList.add("dragging");
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", idx);
      });
      card.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        card.classList.add("drag-over");
      });
      card.addEventListener("dragleave", () => {
        card.classList.remove("drag-over");
      });
      card.addEventListener("drop", (e) => {
        e.preventDefault();
        card.classList.remove("drag-over");
        const fromIdx = mergeState.modalDraggedIndex;
        if (fromIdx !== null && fromIdx !== idx) {
          moveMergeItem(fromIdx, idx);
        }
      });
      card.addEventListener("dragend", () => {
        card.classList.remove("dragging");
        document.querySelectorAll(".merge-grid-card").forEach(c => c.classList.remove("drag-over"));
        mergeState.modalDraggedIndex = null;
      });

      // Card Header
      const header = document.createElement("div");
      header.className = "grid-card-header";
      header.innerHTML = `
        <span class="grid-card-index">#${idx + 1}</span>
        <button type="button" class="btn-remove" title="Remove" style="background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 2px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      `;
      header.querySelector(".btn-remove").addEventListener("click", (e) => {
        e.stopPropagation();
        mergeState.files.splice(idx, 1);
        renderMergeViews();
      });

      // Preview box
      const preview = document.createElement("div");
      preview.className = "grid-card-preview";
      preview.title = "Click to inspect page preview";
      preview.addEventListener("click", () => openQuickFilePreview(f));

      if (f.thumbnail) {
        const img = document.createElement("img");
        img.src = f.thumbnail;
        img.alt = f.filename;
        if (f.rotation) img.style.transform = `rotate(${f.rotation}deg)`;
        preview.appendChild(img);
      } else {
        preview.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path></svg>`;
      }

      const pageTag = document.createElement("span");
      pageTag.className = "page-count-tag";
      pageTag.textContent = `${f.pageCount} page${f.pageCount > 1 ? "s" : ""}`;
      preview.appendChild(pageTag);

      const zoomHint = document.createElement("div");
      zoomHint.className = "preview-zoom-hint";
      zoomHint.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>`;
      preview.appendChild(zoomHint);

      // Card info
      const info = document.createElement("div");
      info.className = "grid-card-info";
      info.innerHTML = `
        <span class="name" title="${f.filename}">${f.filename}</span>
        <div class="meta">
          <span>${formatMergeBytes(f.size)}</span>
          ${f.rotation ? `<span style="font-weight: 600; color: var(--primary);">${f.rotation}°</span>` : ""}
        </div>
      `;

      // Actions bottom bar
      const actions = document.createElement("div");
      actions.className = "grid-card-actions";

      const btnRot = document.createElement("button");
      btnRot.type = "button";
      btnRot.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg><span>Rotate</span>`;
      btnRot.addEventListener("click", (e) => {
        e.stopPropagation();
        f.rotation = (f.rotation + 90) % 360;
        renderMergeViews();
      });

      const btnLeft = document.createElement("button");
      btnLeft.type = "button";
      btnLeft.title = "Move Left";
      btnLeft.disabled = idx === 0;
      btnLeft.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>`;
      btnLeft.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx > 0) moveMergeItem(idx, idx - 1);
      });

      const btnRight = document.createElement("button");
      btnRight.type = "button";
      btnRight.title = "Move Right";
      btnRight.disabled = idx === mergeState.files.length - 1;
      btnRight.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg>`;
      btnRight.addEventListener("click", (e) => {
        e.stopPropagation();
        if (idx < mergeState.files.length - 1) moveMergeItem(idx, idx + 1);
      });

      actions.appendChild(btnRot);
      actions.appendChild(btnLeft);
      actions.appendChild(btnRight);

      card.appendChild(header);
      card.appendChild(preview);
      card.appendChild(info);
      card.appendChild(actions);
      grid.appendChild(card);
    });

    // Add card at end
    const addCard = document.createElement("div");
    addCard.className = "merge-add-card";
    addCard.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
      <div style="font-size: 13px; font-weight: 600;">Add More PDFs</div>
      <div style="font-size: 11px;">Drop files here or click to browse</div>
    `;
    addCard.addEventListener("click", () => {
      if (mergeFileInput) mergeFileInput.click();
    });
    addCard.addEventListener("dragover", (e) => {
      e.preventDefault();
      addCard.style.borderColor = "var(--primary)";
    });
    addCard.addEventListener("dragleave", () => {
      addCard.style.borderColor = "";
    });
    addCard.addEventListener("drop", (e) => {
      e.preventDefault();
      addCard.style.borderColor = "";
      if (e.dataTransfer && e.dataTransfer.files) {
        inspectAndQueuePdfFiles(e.dataTransfer.files);
      }
    });

    grid.appendChild(addCard);
  }

  function renderMergeViews() {
    renderMergeSidebar();
    renderMergeModal();
  }

  function moveMergeItem(fromIdx, toIdx) {
    if (fromIdx < 0 || fromIdx >= mergeState.files.length) return;
    if (toIdx < 0 || toIdx >= mergeState.files.length) return;
    const item = mergeState.files.splice(fromIdx, 1)[0];
    mergeState.files.splice(toIdx, 0, item);
    renderMergeViews();
  }

  function openQuickFilePreview(fileItem) {
    if (!fileItem || !fileItem.thumbnail) return;
    const titleEl = document.getElementById("mergeQuickPreviewTitle");
    const imgEl = document.getElementById("mergeQuickPreviewImg");
    if (titleEl) titleEl.textContent = `Preview: ${fileItem.filename}`;
    if (imgEl) {
      imgEl.src = fileItem.thumbnail;
      imgEl.style.transform = fileItem.rotation ? `rotate(${fileItem.rotation}deg)` : "none";
    }
    openModal("mergeQuickPreviewModal");
  }

  async function executeMerge(openInStudio = false) {
    if (mergeState.files.length < 2) {
      showToast("Please add at least 2 PDF files to merge.", "error");
      return;
    }

    const outInput = document.getElementById(openInStudio ? "mergeModalOutputFilename" : "mergeOutputFilename")
      || document.getElementById("mergeOutputFilename");
    let outName = (outInput && outInput.value.trim()) || "merged_document.pdf";
    if (!outName.toLowerCase().endsWith(".pdf")) outName += ".pdf";

    setLoading(true, `Merging ${mergeState.files.length} PDF documents...`);
    try {
      // Ensure all queued active documents have resolved their files
      for (const f of mergeState.files) {
        if (!f.file && f.readyPromise) {
          await f.readyPromise;
        }
        if (!f.file && f.docId) {
          const res = await fetch(`/api/document/${f.docId}/download`);
          if (res.ok) {
            const blob = await res.blob();
            f.file = new File([blob], f.filename.replace(" (Active)", "").trim() || "document.pdf", { type: "application/pdf" });
          }
        }
      }

      const formData = new FormData();
      for (const f of mergeState.files) {
        if (f.file) {
          formData.append("files", f.file);
        }
      }
      formData.append("rotations", mergeState.files.map(f => f.rotation || 0).join(","));
      formData.append("output_filename", outName);

      const res = await fetch("/api/merge", { method: "POST", body: formData });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Merge failed.");
      }
      const blob = await res.blob();

      if (openInStudio) {
        closeModal("mergeStudioModal");
        const mergedFile = new File([blob], outName, { type: "application/pdf" });
        await handlePdfUpload(mergedFile);
        showToast(`Merged ${mergeState.files.length} files and opened in PDF Studio!`, "success");
      } else {
        downloadBlob(blob, outName);
        showToast(`Merged ${mergeState.files.length} files successfully!`, "success");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }

  window.addActiveDocumentToMergeQueue = addActiveDocumentToMergeQueue;
  window.clearMergeQueue = function() {
    mergeState.files = [];
    renderMergeViews();
    showToast("Merge queue cleared.", "info");
  };

  window.openMergeModal = function() {
    renderMergeViews();
    openModal("mergeStudioModal");
  };

  // Attach Merge Event Listeners
  if (mergeFileInput) {
    mergeFileInput.addEventListener("change", (e) => {
      inspectAndQueuePdfFiles(e.target.files);
    });
  }

  const btnAddMergeFiles = document.getElementById("btnAddMergeFiles");
  if (btnAddMergeFiles) {
    btnAddMergeFiles.addEventListener("click", () => mergeFileInput?.click());
  }

  const btnAddActiveDocToMerge = document.getElementById("btnAddActiveDocToMerge");
  if (btnAddActiveDocToMerge) {
    btnAddActiveDocToMerge.addEventListener("click", () => addActiveDocumentToMergeQueue());
  }

  const btnClearMergeQueue = document.getElementById("btnClearMergeQueue");
  if (btnClearMergeQueue) {
    btnClearMergeQueue.addEventListener("click", () => {
      mergeState.files = [];
      renderMergeViews();
      showToast("Merge queue cleared.", "info");
    });
  }

  if (btnExecuteMerge) {
    btnExecuteMerge.addEventListener("click", () => executeMerge(false));
  }

  const btnMergeAndOpenStudio = document.getElementById("btnMergeAndOpenStudio");
  if (btnMergeAndOpenStudio) {
    btnMergeAndOpenStudio.addEventListener("click", () => executeMerge(true));
  }

  const btnOpenMergeModal = document.getElementById("btnOpenMergeModal");
  if (btnOpenMergeModal) {
    btnOpenMergeModal.addEventListener("click", () => window.openMergeModal());
  }

  const btnModalAddMergeFiles = document.getElementById("btnModalAddMergeFiles");
  if (btnModalAddMergeFiles) {
    btnModalAddMergeFiles.addEventListener("click", () => mergeFileInput?.click());
  }

  const btnModalAddActiveDoc = document.getElementById("btnModalAddActiveDoc");
  if (btnModalAddActiveDoc) {
    btnModalAddActiveDoc.addEventListener("click", () => addActiveDocumentToMergeQueue());
  }

  const btnModalClearMergeQueue = document.getElementById("btnModalClearMergeQueue");
  if (btnModalClearMergeQueue) {
    btnModalClearMergeQueue.addEventListener("click", () => {
      mergeState.files = [];
      renderMergeViews();
      showToast("Merge queue cleared.", "info");
    });
  }

  const btnModalExecuteMerge = document.getElementById("btnModalExecuteMerge");
  if (btnModalExecuteMerge) {
    btnModalExecuteMerge.addEventListener("click", () => executeMerge(false));
  }

  const btnModalMergeAndOpen = document.getElementById("btnModalMergeAndOpen");
  if (btnModalMergeAndOpen) {
    btnModalMergeAndOpen.addEventListener("click", () => executeMerge(true));
  }

  const mergeDropZone = document.getElementById("mergeDropZone");
  if (mergeDropZone) {
    mergeDropZone.addEventListener("click", () => mergeFileInput?.click());
    mergeDropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      mergeDropZone.classList.add("drag-active");
    });
    mergeDropZone.addEventListener("dragleave", () => {
      mergeDropZone.classList.remove("drag-active");
    });
    mergeDropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      mergeDropZone.classList.remove("drag-active");
      if (e.dataTransfer && e.dataTransfer.files) {
        inspectAndQueuePdfFiles(e.dataTransfer.files);
      }
    });
  }

  // 12. Password Protection
  btnApplyPassword.addEventListener("click", async () => {
    const password = document.getElementById("protectPassword").value;
    if (!password) {
      showToast("Please enter a password.", "error");
      return;
    }

    const allowPrint = document.getElementById("permPrint").checked;
    const allowCopy = document.getElementById("permCopy").checked;
    const allowEdit = document.getElementById("permEdit").checked;

    setLoading(true, "Encrypting PDF...");
    const payload = {
      password: password,
      allow_print: allowPrint,
      allow_copy: allowCopy,
      allow_edit: allowEdit
    };

    try {
      const res = await fetch(`/api/document/${state.docId}/protect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Protection failed");
      showToast("Document encrypted with AES-256!", "success");
      updateUndoRedoButtons(true, false);
      document.getElementById("protectPassword").value = "";
      if (state.docInfo) state.docInfo.is_encrypted = true;
      updateSecurityTabUI();
      await loadPage(state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // Feature 29: Unlock PDF (Remove Password) from current document
  const btnUnlockDocument = document.getElementById("btnUnlockDocument");
  if (btnUnlockDocument) {
    btnUnlockDocument.addEventListener("click", async () => {
      const password = document.getElementById("unlockDocPassword")?.value || "";
      if (!password) {
        showToast("Please enter the document password.", "error");
        return;
      }
      setLoading(true, "Decrypting and removing password...");
      try {
        const res = await fetch(`/api/document/${state.docId}/unlock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password })
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.detail || "Incorrect password.");

        showToast("Password removed! Document is now unencrypted.", "success");
        updateUndoRedoButtons(true, false);
        const inputEl = document.getElementById("unlockDocPassword");
        if (inputEl) inputEl.value = "";
        state.docInfo = result.info;
        updateSecurityTabUI();
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  // Standalone Unlock PDF Tool modal handlers
  const btnOpenStandaloneUnlock = document.getElementById("btnOpenStandaloneUnlockModal");
  if (btnOpenStandaloneUnlock) {
    btnOpenStandaloneUnlock.addEventListener("click", () => {
      const err = document.getElementById("standaloneUnlockError");
      if (err) err.style.display = "none";
      const pwIn = document.getElementById("standaloneUnlockPassword");
      if (pwIn) pwIn.value = "";
      const fileIn = document.getElementById("standaloneUnlockFileInput");
      if (fileIn) fileIn.value = "";
      openModal("standaloneUnlockModal");
      setTimeout(() => {
        if (fileIn) fileIn.focus();
      }, 120);
    });
  }

  // 1. Standalone: Unlock & Download
  const btnExecuteStandaloneUnlock = document.getElementById("btnExecuteStandaloneUnlock");
  if (btnExecuteStandaloneUnlock) {
    btnExecuteStandaloneUnlock.addEventListener("click", async () => {
      const fileInput = document.getElementById("standaloneUnlockFileInput");
      const pwInput = document.getElementById("standaloneUnlockPassword");
      const errEl = document.getElementById("standaloneUnlockError");

      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (errEl) {
          errEl.textContent = "Please select a PDF file.";
          errEl.style.display = "block";
        }
        return;
      }

      const file = fileInput.files[0];
      const password = pwInput ? pwInput.value : "";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      setLoading(true, "Decrypting and unlocking PDF...");
      try {
        const res = await fetch("/api/unlock-pdf", {
          method: "POST",
          body: formData
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to unlock PDF. Please check the password.");
        }

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const origBase = file.name.replace(/\.[^/.]+$/, "");
        a.href = url;
        a.download = `${origBase}_unlocked.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        closeModal("standaloneUnlockModal");
        showToast("PDF unlocked and downloaded successfully!", "success");
      } catch (err) {
        if (errEl) {
          errEl.textContent = err.message || "Failed to unlock document.";
          errEl.style.display = "block";
        }
      } finally {
        setLoading(false);
      }
    });
  }

  // 2. Standalone: Unlock & Open in Studio
  const btnStandaloneUnlockAndOpen = document.getElementById("btnStandaloneUnlockAndOpen");
  if (btnStandaloneUnlockAndOpen) {
    btnStandaloneUnlockAndOpen.addEventListener("click", async () => {
      const fileInput = document.getElementById("standaloneUnlockFileInput");
      const pwInput = document.getElementById("standaloneUnlockPassword");
      const errEl = document.getElementById("standaloneUnlockError");

      if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
        if (errEl) {
          errEl.textContent = "Please select a PDF file.";
          errEl.style.display = "block";
        }
        return;
      }

      const file = fileInput.files[0];
      const password = pwInput ? pwInput.value : "";
      closeModal("standaloneUnlockModal");
      await handlePdfUpload(file, password);
    });
  }

  const standaloneUnlockPasswordInput = document.getElementById("standaloneUnlockPassword");
  if (standaloneUnlockPasswordInput) {
    standaloneUnlockPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const btnOpen = document.getElementById("btnStandaloneUnlockAndOpen");
        if (btnOpen) btnOpen.click();
        else {
          const btnExec = document.getElementById("btnExecuteStandaloneUnlock");
          if (btnExec) btnExec.click();
        }
      }
    });
  }

  // Password Prompt Modal event listeners
  const btnSubmitPasswordPrompt = document.getElementById("btnSubmitPasswordPrompt");
  if (btnSubmitPasswordPrompt) {
    btnSubmitPasswordPrompt.addEventListener("click", submitPasswordPrompt);
  }
  const btnPromptUnlockAndDownload = document.getElementById("btnPromptUnlockAndDownload");
  if (btnPromptUnlockAndDownload) {
    btnPromptUnlockAndDownload.addEventListener("click", promptUnlockAndDownload);
  }
  const promptModalPasswordInput = document.getElementById("promptModalPassword");
  if (promptModalPasswordInput) {
    promptModalPasswordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitPasswordPrompt();
      }
    });
  }

  // 13. Annotations, Ink, Stamps, Sticky Notes
  btnSaveInkStrokes.addEventListener("click", async () => {
    if (state.inkStrokes.length === 0) {
      showToast("No ink strokes to save.", "error");
      return;
    }

    const rect = pageCanvasWrapper.getBoundingClientRect();
    const scaleX = state.pageWidthPt / rect.width;
    const scaleY = state.pageHeightPt / rect.height;

    const scaledPaths = state.inkStrokes.map(stroke =>
      stroke.map(pt => [pt[0] * scaleX, pt[1] * scaleY])
    );

    const color = hexToRgb(document.getElementById("inkColor").value);
    const width = parseFloat(document.getElementById("inkWidth").value) || 2;

    setLoading(true, "Saving ink drawing...");
    const payload = {
      drawings: [{
        page: state.currentPage,
        paths: scaledPaths,
        color: color,
        width: width
      }]
    };

    try {
      const res = await fetch(`/api/document/${state.docId}/add-ink`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save ink");
      const data = await res.json();
      showToast("Ink drawing saved to PDF!", "success");
      state.inkStrokes = [];
      const ctx = inkCanvas.getContext("2d");
      ctx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
      toggleInkMode(false);
      await applyMutationResponse(data, state.currentPage);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  document.querySelectorAll(".stamp-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      state.activeStamp = btn.dataset.stamp;
      showToast(`Stamp '${state.activeStamp}' selected. Click on page to place.`, "info");
    });
  });

  if (btnStartStickyNotePlacement) {
    btnStartStickyNotePlacement.addEventListener("click", () => {
      state.activeStickyNotePlacement = true;
      interactiveOverlay.style.cursor = "pointer";
      showToast("Click anywhere on the preview to place a sticky note.", "info");
    });
  }

  // 14. Bookmarks
  btnAddBookmark.addEventListener("click", async () => {
    const title = document.getElementById("newBookmarkTitle").value.trim();
    const page = parseInt(document.getElementById("newBookmarkPage").value) || 1;
    const level = parseInt(document.getElementById("newBookmarkLevel").value) || 1;

    if (!title) {
      showToast("Please enter a bookmark title.", "error");
      return;
    }

    const currentBookmarks = [...state.bookmarks];
    currentBookmarks.push({ title: title, page: page, level: level });

    setLoading(true, "Adding bookmark...");
    try {
      const res = await fetch(`/api/document/${state.docId}/bookmarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarks: currentBookmarks })
      });
      if (!res.ok) throw new Error("Failed to add bookmark");
      showToast("Bookmark added!", "success");
      document.getElementById("newBookmarkTitle").value = "";
      updateUndoRedoButtons(true, false);
      await loadBookmarks();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // 15. Extraction
  btnPreviewText.addEventListener("click", async () => {
    setLoading(true, "Extracting text...");
    try {
      const res = await fetch(`/api/document/${state.docId}/extract-text`);
      if (!res.ok) throw new Error("Failed to extract text");
      const data = await res.json();
      document.getElementById("modalTextContent").value = data.text || "No text found.";
      openModal("textPreviewModal");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  btnDownloadText.addEventListener("click", async () => {
    try {
      const res = await fetch(`/api/document/${state.docId}/extract-text`);
      const data = await res.json();
      const blob = new Blob([data.text], { type: "text/plain;charset=utf-8" });
      downloadBlob(blob, `${state.filename}.txt`);
      showToast("Text file downloaded!", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  btnExtractImages.addEventListener("click", async () => {
    setLoading(true, "Extracting images...");
    try {
      const res = await fetch(`/api/document/${state.docId}/extract-images`);
      if (!res.ok) throw new Error("Extraction failed");
      const blob = await res.blob();
      downloadBlob(blob, `extracted_images_${state.filename}.zip`);
      showToast("Images ZIP downloaded!", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });

  // 16. Optimize & Metadata
  const btnQuickCompress = document.getElementById("btnQuickCompress");
  if (btnQuickCompress) {
    btnQuickCompress.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      setLoading(true, "Compressing PDF streams...");
      try {
        const res = await fetch(`/api/document/${state.docId}/compress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "lossy", preset: "recommended" })
        });
        if (!res.ok) throw new Error("Compression failed");
        const data = await res.json();
        showToast(data.message || "PDF compressed and optimized!", "success");
        updateUndoRedoButtons(true, false);
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  const btnOpenAdvancedCompress = document.getElementById("btnOpenAdvancedCompress");
  if (btnOpenAdvancedCompress) {
    btnOpenAdvancedCompress.addEventListener("click", () => {
      document.querySelector('[data-tab="tab-compress"]')?.click();
    });
  }

  if (btnCompressPdf) {
    btnCompressPdf.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      setLoading(true, "Compressing PDF streams...");
      try {
        const res = await fetch(`/api/document/${state.docId}/compress`, { method: "POST" });
        if (!res.ok) throw new Error("Compression failed");
        const data = await res.json();
        showToast(data.message || "PDF compressed and optimized!", "success");
        updateUndoRedoButtons(true, false);
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  btnSaveMetadata.addEventListener("click", async () => {
    const payload = {
      title: document.getElementById("metaTitle").value,
      author: document.getElementById("metaAuthor").value,
      subject: document.getElementById("metaSubject").value,
      keywords: document.getElementById("metaKeywords").value
    };

    setLoading(true, "Saving metadata...");
    try {
      const res = await fetch(`/api/document/${state.docId}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to save metadata");
      showToast("Metadata properties saved!", "success");
      updateUndoRedoButtons(true, false);
      await loadMetadataAndAudit();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });
}

// Sticky Note Placement
async function handleStickyNotePlacement(e) {
  state.activeStickyNotePlacement = false;
  interactiveOverlay.style.cursor = "default";

  const pt = screenToPagePoint(e.clientX, e.clientY);
  const clickX = Math.max(0, Math.min(state.pageWidthPt || 595, pt.x));
  const clickY = Math.max(0, Math.min(state.pageHeightPt || 842, pt.y));

  const content = prompt("Enter note comment / observation:");
  if (!content) return;

  setLoading(true, "Adding sticky note...");
  try {
    const res = await fetch(`/api/document/${state.docId}/add-sticky-note`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: state.currentPage,
        point: [clickX, clickY],
        content: content,
        author: "User"
      })
    });
    if (!res.ok) throw new Error("Failed to add note");
    const data = await res.json();
    showToast("Sticky note pinned!", "success");
    await applyMutationResponse(data, state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

// Stamp Placement
async function handleStampPlacement(e) {
  if (!state.activeStamp) return;

  const pt = screenToPagePoint(e.clientX, e.clientY);
  const clickX = pt.x;
  const clickY = pt.y;

  const stampW = 120;
  const stampH = 32;
  const maxW = state.pageWidthPt || 595;
  const maxH = state.pageHeightPt || 842;

  const x0 = Math.max(0, Math.min(maxW - stampW, clickX - stampW / 2));
  const y0 = Math.max(0, Math.min(maxH - stampH, clickY - stampH / 2));
  const x1 = Math.min(maxW, x0 + stampW);
  const y1 = Math.min(maxH, y0 + stampH);
  const bbox = [x0, y0, x1, y1];

  setLoading(true, `Placing '${state.activeStamp}' stamp...`);
  try {
    const res = await fetch(`/api/document/${state.docId}/add-stamp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: state.currentPage,
        bbox: bbox,
        text: state.activeStamp
      })
    });
    if (!res.ok) throw new Error("Failed to place stamp");
    const data = await res.json();
    showToast("Stamp placed!", "success");
    state.activeStamp = null;
    document.querySelectorAll(".stamp-btn").forEach(b => b.classList.remove("selected"));
    interactiveOverlay.style.cursor = "default";
    await applyMutationResponse(data, state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

// ==========================================================================
// AcroForm Studio Management & Interactive Engine
// ==========================================================================

async function handleFormPlacement(e) {
  if (!state.formPlacementType || !state.docId) return;

  const pt = screenToPagePoint(e.clientX, e.clientY);
  const clickXPt = pt.x;
  const clickYPt = pt.y;

  let defW = 160;
  let defH = 26;
  const fType = state.formPlacementType;

  if (fType === "textarea" || fType === "multiline") {
    defW = 200;
    defH = 60;
  } else if (fType === "checkbox" || fType === "radio") {
    defW = 20;
    defH = 20;
  } else if (fType === "combobox" || fType === "choice") {
    defW = 160;
    defH = 26;
  } else if (fType === "signature") {
    defW = 180;
    defH = 50;
  }

  const x0 = Math.round(clickXPt);
  const y0 = Math.round(clickYPt);
  const x1 = Math.round(Math.min(state.pageWidthPt, x0 + defW));
  const y1 = Math.round(Math.min(state.pageHeightPt, y0 + defH));

  const existingOfType = (state.formFields || []).filter(f => f.type === fType);
  const defaultName = `${fType}_${existingOfType.length + 1}`;

  setLoading(true, `Adding ${fType} field '${defaultName}'...`);

  const payload = {
    page: state.currentPage,
    type: fType,
    name: defaultName,
    bbox: [x0, y0, x1, y1],
    font_size: 11,
    choices: fType === "combobox" ? ["Option 1", "Option 2", "Option 3"] : []
  };

  fetch(`/api/document/${state.docId}/add-form-field`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
  .then(async res => {
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to add form field");
    }
    const data = await res.json();
    showToast(`Form field '${defaultName}' added! Customize properties in sidebar.`, "success");
    cancelFormPlacement();
    await applyMutationResponse(data, state.currentPage);
    await loadFormFields();

    const created = (state.formFields || []).find(f => f.name === defaultName && f.page === state.currentPage);
    if (created) selectFormField(created);
  })
  .catch(err => {
    showToast(err.message, "error");
  })
  .finally(() => {
    setLoading(false);
  });
}

function cancelFormPlacement() {
  state.formPlacementType = null;
  document.querySelectorAll(".palette-field-btn").forEach(b => b.classList.remove("active"));
  const hint = document.getElementById("formPlacementHint");
  if (hint) hint.style.display = "none";
  interactiveOverlay.style.cursor = "default";
}

function deselectFormField() {
  if (!state.selectedFormField) return;
  state.selectedFormField = null;
  document.querySelectorAll(".form-overlay-wrapper.selected-field").forEach(w => w.classList.remove("selected-field"));
  document.querySelectorAll(".form-item-row.active").forEach(r => r.classList.remove("active"));
  const card = document.getElementById("fieldInspectorCard");
  if (card) card.style.display = "none";
}

function selectFormField(field) {
  state.selectedFormField = field;
  const card = document.getElementById("fieldInspectorCard");

  // Highlight wrapper on canvas
  document.querySelectorAll(".form-overlay-wrapper").forEach(w => {
    if (w.dataset.fieldName === field.name) {
      w.classList.add("selected-field");
    } else {
      w.classList.remove("selected-field");
    }
  });

  // Highlight in sidebar list
  document.querySelectorAll(".form-item-row").forEach(row => {
    if (row.dataset.fieldName === field.name) {
      row.classList.add("active");
      row.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      row.classList.remove("active");
    }
  });

  if (card) {
    card.style.display = "block";
    const titleEl = document.getElementById("inspectorFieldTitle");
    if (titleEl) titleEl.textContent = `Field: ${field.name}`;
    const badgeEl = document.getElementById("inspectorFieldTypeBadge");
    if (badgeEl) badgeEl.textContent = (field.type || "text").toUpperCase();
    
    const nameInput = document.getElementById("propFieldName");
    if (nameInput) nameInput.value = field.name || "";

    const valInput = document.getElementById("propFieldValue");
    if (valInput) valInput.value = field.value !== null && field.value !== undefined ? field.value : "";

    const choicesGroup = document.getElementById("propChoicesGroup");
    const choicesInput = document.getElementById("propFieldChoices");
    if (choicesGroup && choicesInput) {
      if (field.type === "combobox" || field.type === "choice" || (field.choices && field.choices.length > 0)) {
        choicesGroup.style.display = "block";
        choicesInput.value = (field.choices || []).join(", ");
      } else {
        choicesGroup.style.display = "none";
      }
    }

    const fontSelect = document.getElementById("propFieldFontSize");
    if (fontSelect && field.font_size) {
      fontSelect.value = String(Math.round(field.font_size));
    }

    const reqCheckbox = document.getElementById("propFieldRequired");
    if (reqCheckbox) reqCheckbox.checked = Boolean(field.is_required);

    const roCheckbox = document.getElementById("propFieldReadOnly");
    if (roCheckbox) roCheckbox.checked = Boolean(field.is_read_only);
  }
}

async function applyFieldProps() {
  if (!state.selectedFormField || !state.docId) {
    showToast("No field selected to update.", "error");
    return;
  }

  const newName = document.getElementById("propFieldName").value.trim();
  const newValue = document.getElementById("propFieldValue").value;
  const choicesRaw = document.getElementById("propFieldChoices").value;
  const fontSize = parseFloat(document.getElementById("propFieldFontSize").value) || 11;
  const isRequired = document.getElementById("propFieldRequired").checked;
  const isReadOnly = document.getElementById("propFieldReadOnly").checked;

  if (!newName) {
    showToast("Field name cannot be empty.", "error");
    return;
  }

  const choicesList = choicesRaw ? choicesRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  setLoading(true, `Updating field '${state.selectedFormField.name}'...`);
  const payload = {
    page: state.selectedFormField.page || state.currentPage,
    field_name: state.selectedFormField.name,
    new_name: newName,
    new_value: newValue,
    new_choices: choicesList.length > 0 ? choicesList : undefined,
    font_size: fontSize,
    is_required: isRequired,
    is_read_only: isReadOnly
  };

  try {
    const res = await fetch(`/api/document/${state.docId}/forms/update-field`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to update form field");
    }
    const data = await res.json();
    showToast(`Updated field '${newName}'!`, "success");
    await applyMutationResponse(data, state.currentPage);
    await loadFormFields();

    const updated = (state.formFields || []).find(f => f.name === newName);
    if (updated) selectFormField(updated);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function deleteSelectedField() {
  if (!state.selectedFormField || !state.docId) {
    showToast("No field selected to delete.", "error");
    return;
  }
  const fieldToDelete = state.selectedFormField;
  showConfirmModal("Delete Form Field", `Delete form field '${fieldToDelete.name}' from document?`, async () => {
    setLoading(true, `Deleting field '${fieldToDelete.name}'...`);
    try {
      const res = await fetch(`/api/document/${state.docId}/forms/delete-field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page: fieldToDelete.page || state.currentPage,
          field_name: fieldToDelete.name
        })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete form field");
      }
      const data = await res.json();
      showToast(`Field '${fieldToDelete.name}' deleted!`, "success");
      deselectFormField();
      await applyMutationResponse(data, state.currentPage);
      await loadFormFields();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  });
}

// AcroForms Loader
async function loadFormFields() {
  if (!state.docId) return;
  try {
    const res = await fetch(`/api/document/${state.docId}/forms`);
    if (!res.ok) return;
    const data = await res.json();
    state.formFields = data.fields || [];

    const countSpan = document.getElementById("formFieldsCount");
    if (countSpan) countSpan.textContent = state.formFields.length;

    if (state.formFields.length === 0) {
      formFieldsContainer.innerHTML = '<div class="empty-state">No form fields found on this document. Click a field type above to create one!</div>';
    } else {
      formFieldsContainer.innerHTML = state.formFields.map(f => {
        const isCurrent = f.page === state.currentPage;
        let controlHtml = "";
        if (f.type === "checkbox") {
          controlHtml = `<input type="checkbox" data-field-name="${f.name}" class="form-field-input-control" ${f.value ? "checked" : ""}>`;
        } else if (f.type === "radio") {
          controlHtml = `<input type="radio" data-field-name="${f.name}" class="form-field-input-control" ${f.value ? "checked" : ""}>`;
        } else if ((f.type === "combobox" || f.type === "choice") && f.choices && f.choices.length > 0) {
          controlHtml = `
            <select data-field-name="${f.name}" class="form-control form-field-input-control">
              ${f.choices.map(opt => `<option value="${opt}" ${opt === f.value ? "selected" : ""}>${opt}</option>`).join("")}
            </select>
          `;
        } else if (f.is_multiline || f.type === "textarea") {
          controlHtml = `<textarea rows="2" data-field-name="${f.name}" class="form-control form-field-input-control">${f.value || ""}</textarea>`;
        } else if (f.type === "signature") {
          controlHtml = `<div class="sig-badge"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Signature Field</div>`;
        } else {
          controlHtml = `<input type="text" data-field-name="${f.name}" class="form-control form-field-input-control" value="${f.value || ""}">`;
        }

        return `
          <div class="form-item-row ${state.selectedFormField && state.selectedFormField.name === f.name ? "active" : ""}" data-field-name="${f.name}">
            <div class="form-item-header">
              <div class="form-item-title-col">
                <span class="field-item-name"><strong>${f.name}</strong></span>
                <span class="field-tag-type">${f.type}</span>
                <span class="badge ${isCurrent ? 'badge-primary' : ''}">p. ${f.page}</span>
              </div>
              <div class="form-item-actions">
                <button type="button" class="btn-item-action btn-item-inspect" title="Inspect &amp; Edit Properties" data-field-name="${f.name}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                <button type="button" class="btn-item-action btn-item-delete" title="Delete Field" data-field-name="${f.name}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
              </div>
            </div>
            <div class="form-item-body">
              ${controlHtml}
            </div>
          </div>
        `;
      }).join("");

      // Attach event listeners to sidebar items
      formFieldsContainer.querySelectorAll(".btn-item-inspect").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.dataset.fieldName;
          const targetField = state.formFields.find(f => f.name === name);
          if (targetField) {
            if (targetField.page !== state.currentPage) {
              loadPage(targetField.page).then(() => selectFormField(targetField));
            } else {
              selectFormField(targetField);
            }
          }
        });
      });

      formFieldsContainer.querySelectorAll(".btn-item-delete").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          const name = btn.dataset.fieldName;
          const targetField = state.formFields.find(f => f.name === name);
          if (targetField) {
            state.selectedFormField = targetField;
            deleteSelectedField();
          }
        });
      });

      formFieldsContainer.querySelectorAll(".form-item-row").forEach(row => {
        row.addEventListener("click", () => {
          const name = row.dataset.fieldName;
          const targetField = state.formFields.find(f => f.name === name);
          if (targetField) {
            if (targetField.page !== state.currentPage) {
              loadPage(targetField.page).then(() => selectFormField(targetField));
            } else {
              selectFormField(targetField);
            }
          }
        });
      });
    }
    renderFormOverlays(state.currentPage);
  } catch (err) {
    console.error("Form load error:", err);
  }
}

function renderFormOverlays(pageNumber) {
  interactiveOverlay.querySelectorAll(".form-overlay-wrapper, .form-overlay-widget").forEach(w => w.remove());
  if (!state.formFields || state.formFields.length === 0) return;

  const overlayRect = interactiveOverlay.getBoundingClientRect();
  if (overlayRect.width === 0 || overlayRect.height === 0) {
    setTimeout(() => renderFormOverlays(pageNumber), 50);
    return;
  }

  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;

  state.formFields.filter(f => f.page === pageNumber).forEach(field => {
    const [x0, y0, x1, y1] = field.rect;
    const left = x0 * scaleX;
    const top = y0 * scaleY;
    const origWPt = Math.max(x1 - x0, 14);
    const origHPt = Math.max(y1 - y0, 12);
    const w = Math.max(origWPt * scaleX, 16);
    const h = Math.max(origHPt * scaleY, 14);

    const wrapper = document.createElement("div");
    wrapper.className = `form-overlay-wrapper form-type-${field.type || 'text'}`;
    if (state.selectedFormField && state.selectedFormField.name === field.name) {
      wrapper.classList.add("selected-field");
    }
    if (top < 26) {
      wrapper.classList.add("header-bottom");
    }
    wrapper.style.position = "absolute";
    wrapper.style.left = `${left}px`;
    wrapper.style.top = `${top}px`;
    wrapper.style.width = `${w}px`;
    wrapper.style.height = `${h}px`;
    wrapper.dataset.fieldName = field.name;

    // Click wrapper to select field
    wrapper.addEventListener("click", (e) => {
      e.stopPropagation();
      selectFormField(field);
    });

    const dragBar = document.createElement("div");
    dragBar.className = "form-overlay-drag-bar";
    dragBar.innerHTML = `
      <span class="drag-title" title="${field.name}"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display:inline;vertical-align:middle;margin-right:2px;"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="15 19 12 22 9 19"></polyline><polyline points="19 9 22 12 19 15"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>${field.name}</span>
      <span class="field-badge">${field.type}</span>
      <button class="btn-overlay-delete" title="Delete Field"><svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
    `;

    // Direct delete button in overlay
    dragBar.querySelector(".btn-overlay-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      state.selectedFormField = field;
      deleteSelectedField();
    });

    wrapper.appendChild(dragBar);

    // Widget element
    let input;
    const isMultiline = field.is_multiline || field.type === "textarea";
    if (field.type === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.className = "form-overlay-widget form-overlay-checkbox";
      input.checked = Boolean(field.value);
    } else if (field.type === "radio") {
      input = document.createElement("input");
      input.type = "radio";
      input.name = "form_radio_group";
      input.className = "form-overlay-widget form-overlay-radio";
      input.checked = Boolean(field.value);
    } else if ((field.type === "combobox" || field.type === "choice") && field.choices && field.choices.length > 0) {
      input = document.createElement("select");
      input.className = "form-overlay-widget form-overlay-select";
      field.choices.forEach(opt => {
        const optEl = document.createElement("option");
        optEl.value = opt;
        optEl.textContent = opt;
        if (opt === field.value) optEl.selected = true;
        input.appendChild(optEl);
      });
    } else if (isMultiline) {
      input = document.createElement("textarea");
      input.className = "form-overlay-widget form-overlay-textarea";
      input.value = field.value || "";
    } else if (field.type === "signature") {
      input = document.createElement("div");
      input.className = "form-overlay-widget signature-widget";
      input.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg> Signature Area';
    } else {
      input = document.createElement("input");
      input.type = "text";
      input.className = "form-overlay-widget";
      input.value = field.value || "";
    }

    input.dataset.fieldName = field.name;

    if (field.type !== "signature") {
      input.addEventListener("input", (e) => {
        field.value = (field.type === "checkbox" || field.type === "radio") ? e.target.checked : e.target.value;
        const sidebarInput = document.querySelector(`.form-field-input-control[data-field-name="${field.name}"]`);
        if (sidebarInput) {
          if (field.type === "checkbox" || field.type === "radio") sidebarInput.checked = e.target.checked;
          else sidebarInput.value = e.target.value;
        }
      });
    }

    wrapper.appendChild(input);

    interactiveOverlay.appendChild(wrapper);

    // Make Draggable from dragBar or wrapper
    const dragHandle = (field.type === "signature") ? wrapper : dragBar;
    makeDraggable(wrapper, dragHandle, async (finalX, finalY, finalW, finalH, moved) => {
      if (!moved) return;
      const newPtX0 = Math.round(finalX / scaleX);
      const newPtY0 = Math.round(finalY / scaleY);
      const currentPtW = Math.max(14, Math.round(finalW / scaleX));
      const currentPtH = Math.max(12, Math.round(finalH / scaleY));
      const newPtX1 = newPtX0 + currentPtW;
      const newPtY1 = newPtY0 + currentPtH;
      const newBbox = [newPtX0, newPtY0, newPtX1, newPtY1];

      field.rect = newBbox;

      try {
        const res = await fetch(`/api/document/${state.docId}/forms/move-field`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: state.currentPage,
            name: field.name,
            bbox: newBbox
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to update field position");
        }
        const data = await res.json();
        showToast(`Moved field '${field.name}' to (${newPtX0}, ${newPtY0})`, "info");
        await applyMutationResponse(data, state.currentPage);
      } catch (err) {
        console.error("Move field error:", err);
        showToast(err.message, "error");
      }
    });

    // Make 8-Point Resizable
    makeResizable(wrapper, async (finalL, finalT, finalW, finalH) => {
      const curPtX0 = Math.round(finalL / scaleX);
      const curPtY0 = Math.round(finalT / scaleY);
      const newPtW = Math.max(14, Math.round(finalW / scaleX));
      const newPtH = Math.max(12, Math.round(finalH / scaleY));
      const newBbox = [curPtX0, curPtY0, curPtX0 + newPtW, curPtY0 + newPtH];

      field.rect = newBbox;

      try {
        const res = await fetch(`/api/document/${state.docId}/forms/move-field`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: state.currentPage,
            name: field.name,
            bbox: newBbox
          })
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || "Failed to resize field");
        }
        const data = await res.json();
        showToast(`Resized field '${field.name}' to ${newPtW}×${newPtH} pt`, "info");
        await applyMutationResponse(data, state.currentPage);
      } catch (err) {
        console.error("Resize field error:", err);
        showToast(err.message, "error");
      }
    });
  });
}

// Bookmarks Loader
async function loadBookmarks() {
  if (!state.docId) return;
  try {
    const res = await fetch(`/api/document/${state.docId}/bookmarks`);
    if (!res.ok) return;
    const data = await res.json();
    state.bookmarks = data.bookmarks || [];

    if (state.bookmarks.length === 0) {
      bookmarksTreeContainer.innerHTML = '<div class="empty-state">No outline bookmarks found in this PDF.</div>';
    } else {
      bookmarksTreeContainer.innerHTML = state.bookmarks.map(b => `
        <div class="bookmark-item" style="padding: 6px 8px; cursor: pointer; border-radius: 4px; display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;" onclick="loadPage(${b.page})">
          <span><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;display:inline;vertical-align:middle;"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>${b.title}</span>
          <small class="badge">p. ${b.page}</small>
        </div>
      `).join("");
    }
  } catch (err) {
    console.error("Bookmarks error:", err);
  }
}

// Metadata & Audit
async function loadMetadataAndAudit() {
  if (!state.docId) return;
  try {
    const [metaRes, auditRes] = await Promise.all([
      fetch(`/api/document/${state.docId}/metadata`),
      fetch(`/api/document/${state.docId}/security-inspect`)
    ]);

    if (metaRes.ok) {
      const metaData = await metaRes.json();
      const m = metaData.metadata || {};
      document.getElementById("metaTitle").value = m.title || "";
      document.getElementById("metaAuthor").value = m.author || "";
      document.getElementById("metaSubject").value = m.subject || "";
      document.getElementById("metaKeywords").value = m.keywords || "";
    }

    if (auditRes.ok) {
      const audit = await auditRes.json();
      const details = document.getElementById("auditReportDetails");
      details.innerHTML = `
        <div class="audit-row">
          <span>Format &amp; Version:</span>
          <strong>${audit.format}</strong>
        </div>
        <div class="audit-row">
          <span>Encryption:</span>
          <span class="audit-pill ${audit.is_encrypted ? 'audit-pill-ok' : 'audit-pill-warn'}">
            ${audit.is_encrypted ? 'AES-256 Encrypted' : 'None (Unprotected)'}
          </span>
        </div>
        <div class="audit-row">
          <span>PDF/A Archival:</span>
          <span class="audit-pill ${audit.is_pdfa ? 'audit-pill-ok' : 'audit-pill-warn'}">
            ${audit.is_pdfa ? 'PDF/A Conformance' : 'Standard PDF'}
          </span>
        </div>
        <div class="audit-row">
          <span>JavaScript Scripts:</span>
          <strong style="color: ${audit.has_javascript ? '#ef4444' : '#10b981'};">${audit.has_javascript ? 'Detected' : 'Clean (None)'}</strong>
        </div>
        <div class="audit-row">
          <span>Attachments:</span>
          <strong>${audit.attachments_count} file(s)</strong>
        </div>
      `;
    }
  } catch (err) {
    console.error("Audit error:", err);
  }
}

// ==========================================================================
// Thumbnails, Drag & Drop, and Context Menu
// ==========================================================================

function populateThumbnails() {
  if (!previewList) return;
  previewList.innerHTML = "";

  let draggedItem = null;

  const thumbnailObserver = ("IntersectionObserver" in window) ? new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute("data-src");
          observer.unobserve(img);
        }
      }
    });
  }, { root: previewList, rootMargin: "120px 0px" }) : null;

  for (let i = 1; i <= state.totalPages; i++) {
    const wrapper = document.createElement("div");
    wrapper.className = "thumbnail-wrapper";
    wrapper.dataset.page = i;
    wrapper.draggable = true;
    if (i === state.currentPage) wrapper.classList.add("active");

    wrapper.addEventListener("click", () => {
      if (state.currentPage !== i) loadPage(i);
    });

    // Right-click context menu
    wrapper.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      openThumbnailContextMenu(e.clientX, e.clientY, i);
    });

    // Drag and Drop reordering
    wrapper.addEventListener("dragstart", (e) => {
      draggedItem = wrapper;
      wrapper.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", i);
    });

    wrapper.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      wrapper.classList.add("drag-over");
    });

    wrapper.addEventListener("dragleave", () => {
      wrapper.classList.remove("drag-over");
    });

    wrapper.addEventListener("drop", async (e) => {
      e.preventDefault();
      wrapper.classList.remove("drag-over");
      if (!draggedItem || draggedItem === wrapper) return;

      const fromPage = parseInt(draggedItem.dataset.page);
      const toPage = parseInt(wrapper.dataset.page);

      // Build new sequence
      const order = Array.from({ length: state.totalPages }, (_, idx) => idx + 1);
      const itemToMove = order.splice(fromPage - 1, 1)[0];
      order.splice(toPage - 1, 0, itemToMove);

      showToast(`Moving Page ${fromPage} to Page ${toPage}...`, "info");
      await applyPageOrder(order);
    });

    wrapper.addEventListener("dragend", () => {
      wrapper.classList.remove("dragging");
      document.querySelectorAll(".thumbnail-wrapper").forEach(w => w.classList.remove("drag-over"));
    });

    const img = document.createElement("img");
    img.className = "thumbnail-image";
    img.loading = "lazy";
    const thumbUrl = `/api/document/${state.docId}/page/${i}/image?zoom=0.18&format=jpeg&v=${state.docVersion || 1}`;

    if (thumbnailObserver) {
      if (i <= 4) {
        img.src = thumbUrl;
      } else {
        img.dataset.src = thumbUrl;
        thumbnailObserver.observe(img);
      }
    } else {
      img.src = thumbUrl;
    }

    const num = document.createElement("div");
    num.className = "thumbnail-number";
    num.textContent = `Page ${i}`;

    wrapper.appendChild(img);
    wrapper.appendChild(num);
    previewList.appendChild(wrapper);
  }
  if (typeof renderSplitViews === "function") {
    renderSplitViews();
  }
}

function syncActiveThumbnail(pageNumber) {
  if (!previewList) return;
  const allThumbnails = previewList.querySelectorAll(".thumbnail-wrapper");
  allThumbnails.forEach(t => t.classList.remove("active"));

  const current = previewList.querySelector(`.thumbnail-wrapper[data-page="${pageNumber}"]`);
  if (current) {
    current.classList.add("active");
    // Scroll only inside the previewList container without touching main viewport
    const containerTop = previewList.scrollTop;
    const containerBottom = containerTop + previewList.clientHeight;
    const elemTop = current.offsetTop;
    const elemBottom = elemTop + current.offsetHeight;
    if (elemTop < containerTop) {
      previewList.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      previewList.scrollTop = elemBottom - previewList.clientHeight;
    }
  }
}

function openThumbnailContextMenu(x, y, pageNumber) {
  state.contextMenuPage = pageNumber;
  thumbnailContextMenu.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
  thumbnailContextMenu.style.top = `${Math.min(y, window.innerHeight - 250)}px`;
  thumbnailContextMenu.style.display = "block";
}

function setupThumbnailsContextMenu() {
  document.addEventListener("click", () => {
    if (thumbnailContextMenu) thumbnailContextMenu.style.display = "none";
  });

  document.getElementById("ctxGoToPage").addEventListener("click", () => {
    if (state.contextMenuPage) loadPage(state.contextMenuPage);
  });

  document.getElementById("ctxDuplicatePage").addEventListener("click", async () => {
    if (state.contextMenuPage) {
      state.currentPage = state.contextMenuPage;
      await duplicateCurrentPage();
    }
  });

  document.getElementById("ctxRotateCW").addEventListener("click", async () => {
    if (state.contextMenuPage) {
      state.currentPage = state.contextMenuPage;
      await rotateCurrentPage(90);
    }
  });

  document.getElementById("ctxRotateCCW").addEventListener("click", async () => {
    if (state.contextMenuPage) {
      state.currentPage = state.contextMenuPage;
      await rotateCurrentPage(270);
    }
  });

  document.getElementById("ctxInsertBlankBefore").addEventListener("click", async () => {
    if (state.contextMenuPage) {
      document.getElementById("insertBlankAt").value = state.contextMenuPage;
      btnInsertBlankPageSubmit.click();
    }
  });

  document.getElementById("ctxInsertBlankAfter").addEventListener("click", async () => {
    if (state.contextMenuPage) {
      document.getElementById("insertBlankAt").value = state.contextMenuPage + 1;
      btnInsertBlankPageSubmit.click();
    }
  });

  document.getElementById("ctxDeletePage").addEventListener("click", () => {
    if (state.totalPages <= 1) {
      showToast("Cannot delete the only page in document.", "error");
      return;
    }
    const targetPage = state.contextMenuPage;
    showConfirmModal("Delete Page", `Delete Page ${targetPage}?`, async () => {
      const remainingPages = [];
      for (let i = 1; i <= state.totalPages; i++) {
        if (i !== targetPage) remainingPages.push(i);
      }
      await applyPageOrder(remainingPages);
    });
  });
}

// Resizer
function setupResizer() {
  if (!rightPanelResizer || !rightPreviewPanel) return;
  let isResizing = false;
  let startX, startWidth;

  rightPanelResizer.addEventListener("mousedown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = parseInt(document.defaultView.getComputedStyle(rightPreviewPanel).width, 10);
    rightPanelResizer.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isResizing) return;
    const dx = startX - e.clientX;
    let newWidth = startWidth + dx;
    if (newWidth < 110) newWidth = 110;
    if (newWidth > 400) newWidth = 400;
    rightPreviewPanel.style.width = `${newWidth}px`;
  });

  document.addEventListener("mouseup", () => {
    if (isResizing) {
      isResizing = false;
      rightPanelResizer.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });
}

// ==========================================================================
// Command Palette (Ctrl+K)
// ==========================================================================

const COMMANDS = [
  { name: "Edit Text Blocks", category: "Edit", action: () => document.querySelector('[data-tab="tab-edit"]').click() },
  { name: "Add New Text Box", category: "Edit", action: () => document.querySelector('[data-tab="tab-add"]').click() },
  { name: "Insert Image or Signature", category: "Edit", action: () => document.querySelector('[data-tab="tab-image"]').click() },
  { name: "Draw Shapes & Lines", category: "Edit", action: () => document.querySelector('[data-tab="tab-shapes"]').click() },
  { name: "Fill & Create AcroForms", category: "Forms", action: () => document.querySelector('[data-tab="tab-forms"]').click() },
  { name: "Add Page Numbering", category: "Pages", action: () => document.querySelector('[data-tab="tab-page-numbers"]').click() },
  { name: "Rotate Current Page 90°", category: "Pages", action: () => rotateCurrentPage(90) },
  { name: "Duplicate Current Page", category: "Pages", action: () => duplicateCurrentPage() },
  { name: "Insert Blank Page", category: "Pages", action: () => document.querySelector('[data-tab="tab-organize"]').click() },
  { name: "Split & Extract Pages", category: "Pages", action: () => document.querySelector('[data-tab="tab-split"]').click() },
  { name: "Visual Split Studio (Page Picker)", category: "Pages", action: () => window.openSplitModal() },
  { name: "Merge Multiple PDFs", category: "Pages", action: () => document.querySelector('[data-tab="tab-merge"]').click() },
  { name: "Visual Merge Studio (Organizer)", category: "Pages", action: () => window.openMergeModal() },
  { name: "Redact Sensitive Text", category: "Security", action: () => document.querySelector('[data-tab="tab-redact"]').click() },
  { name: "Apply Watermark", category: "Security", action: () => document.querySelector('[data-tab="tab-watermark"]').click() },
  { name: "Set AES-256 Password", category: "Security", action: () => document.querySelector('[data-tab="tab-protect"]').click() },
  { name: "Unlock PDF (Remove Password)", category: "Security", action: () => { document.querySelector('[data-tab="tab-protect"]').click(); updateSecurityTabUI(); } },
  { name: "Standalone Unlock / Decrypt Tool", category: "Security", action: () => document.getElementById("btnOpenStandaloneUnlockModal")?.click() },
  { name: "Freehand Pencil Drawing", category: "Tools", action: () => { document.querySelector('[data-tab="tab-annotate"]').click(); toggleInkMode(true); } },
  { name: "Place Sticky Note", category: "Tools", action: () => { document.querySelector('[data-tab="tab-annotate"]').click(); btnStartStickyNotePlacement.click(); } },
  { name: "Extract Full Document Text", category: "Tools", action: () => btnPreviewText.click() },
  { name: "Extract Embedded Images", category: "Tools", action: () => btnExtractImages.click() },
  { name: "Compress & Optimize PDF", category: "Tools", action: () => document.querySelector('[data-tab="tab-compress"]').click() },
  { name: "Security & Compliance Audit", category: "Tools", action: () => document.querySelector('[data-tab="tab-optimize"]').click() },
  { name: "All PDF Tools Directory", category: "Tools", action: () => window.showLandingPage() },
  { name: "Download Edited PDF", category: "File", action: () => btnDownload.click() },
  { name: "Toggle Dark / Light Mode", category: "Theme", action: () => btnThemeToggle.click() }
];

function setupCommandPalette() {
  if (btnCommandPalette) {
    btnCommandPalette.addEventListener("click", openCommandPalette);
  }

  cmdInput.addEventListener("input", (e) => {
    renderCommandResults(e.target.value);
  });

  cmdInput.addEventListener("keydown", (e) => {
    const items = cmdResultsList.querySelectorAll(".cmd-item");
    if (items.length === 0) return;

    let selectedIdx = Array.from(items).findIndex(it => it.classList.contains("selected"));

    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedIdx = (selectedIdx + 1) % items.length;
      highlightCommandItem(items, selectedIdx);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedIdx = (selectedIdx - 1 + items.length) % items.length;
      highlightCommandItem(items, selectedIdx);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIdx >= 0 && items[selectedIdx]) items[selectedIdx].click();
    }
  });
}

function openCommandPalette() {
  cmdInput.value = "";
  renderCommandResults("");
  openModal("commandPaletteModal");
  setTimeout(() => cmdInput.focus(), 50);
}

function renderCommandResults(query) {
  const q = query.toLowerCase().trim();
  const matches = COMMANDS.filter(cmd => cmd.name.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q));

  if (matches.length === 0) {
    cmdResultsList.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px;">No matching tools or commands found.</div>';
    return;
  }

  cmdResultsList.innerHTML = matches.map((cmd, i) => `
    <div class="cmd-item ${i === 0 ? 'selected' : ''}" data-index="${i}">
      <span>${cmd.name}</span>
      <span class="cmd-item-category">${cmd.category}</span>
    </div>
  `).join("");

  cmdResultsList.querySelectorAll(".cmd-item").forEach((el, idx) => {
    el.addEventListener("click", () => {
      closeModal("commandPaletteModal");
      matches[idx].action();
    });
  });
}

function highlightCommandItem(items, idx) {
  items.forEach(it => it.classList.remove("selected"));
  if (items[idx]) {
    items[idx].classList.add("selected");
    items[idx].scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

// ==========================================================================
// Keyboard Shortcuts
// ==========================================================================

function setupKeyboardShortcuts() {
  document.addEventListener("keydown", (e) => {
    const tag = (e.target.tagName || "").toLowerCase();
    const isTyping = tag === "input" || tag === "textarea" || e.target.isContentEditable;

    // Ctrl+Z: Undo
    if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (btnUndo && !btnUndo.disabled) btnUndo.click();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z: Redo
    if ((e.ctrlKey && e.key.toLowerCase() === "y") || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z")) {
      e.preventDefault();
      if (btnRedo && !btnRedo.disabled) btnRedo.click();
      return;
    }

    // Ctrl+S: Download PDF
    if (e.ctrlKey && e.key.toLowerCase() === "s") {
      e.preventDefault();
      btnDownload.click();
      return;
    }

    // Ctrl+F: Find
    if (e.ctrlKey && e.key.toLowerCase() === "f") {
      e.preventDefault();
      toggleSearchBar();
      return;
    }

    // Ctrl+K: Command Palette
    if (e.ctrlKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openCommandPalette();
      return;
    }

    // Layer Depth Shortcuts: Ctrl+], Ctrl+[, Alt+], Alt+[
    if (activeTransformBox) {
      if (e.ctrlKey && e.key === "]") {
        e.preventDefault();
        activeTransformBox._triggerLayer?.("bring_to_front");
        return;
      }
      if (e.ctrlKey && e.key === "[") {
        e.preventDefault();
        activeTransformBox._triggerLayer?.("send_to_back");
        return;
      }
      if (e.altKey && e.key === "]") {
        e.preventDefault();
        activeTransformBox._triggerLayer?.("bring_forward");
        return;
      }
      if (e.altKey && e.key === "[") {
        e.preventDefault();
        activeTransformBox._triggerLayer?.("send_backward");
        return;
      }
    }

    // Escape: Close modals, search bar, wysiwyg, cancel transform box, cancel measurements, deselect form field
    if (e.key === "Escape") {
      if (activeTransformBox) cancelTransformBox(false);
      if (activeWysiwygBox) cancelWysiwyg();
      closeSearchBar();
      if (state.activeTab === "tab-shapes" && state.shapesSubMode === "ruler") {
        if (typeof window.setShapesSubMode === "function") {
          window.setShapesSubMode("shapes");
        }
      } else {
        cancelMeasurement();
      }
      deselectFormField();
      if (state.isVisualCropping) {
        cancelVisualCrop();
      }
      document.querySelectorAll(".modal.open").forEach(m => m.classList.remove("open"));
      if (thumbnailContextMenu) thumbnailContextMenu.style.display = "none";
      return;
    }

    // Page Navigation when NOT typing
    if (!isTyping && state.docId) {
      if (e.key === "ArrowLeft" || e.key === "PageUp" || e.key === "k") {
        e.preventDefault();
        if (state.currentPage > 1) loadPage(state.currentPage - 1);
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === "j") {
        e.preventDefault();
        if (state.currentPage < state.totalPages) loadPage(state.currentPage + 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        loadPage(1);
      } else if (e.key === "End") {
        e.preventDefault();
        loadPage(state.totalPages);
      } else if (e.key === "+" || (e.ctrlKey && e.key === "=")) {
        e.preventDefault();
        btnZoomIn.click();
      } else if (e.key === "-" || (e.ctrlKey && e.key === "-")) {
        e.preventDefault();
        btnZoomOut.click();
      } else if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        btnFitWidth.click();
      }
    }
  });

  // WYSIWYG Toolbar bindings
  const btnBold = document.getElementById("wysiwygBold");
  const btnItalic = document.getElementById("wysiwygItalic");
  const btnUnderline = document.getElementById("wysiwygUnderline");
  const btnStrikethrough = document.getElementById("wysiwygStrikethrough");
  const btnAlignL = document.getElementById("wysiwygAlignLeft");
  const btnAlignC = document.getElementById("wysiwygAlignCenter");
  const inColor = document.getElementById("wysiwygColor");
  const btnCommit = document.getElementById("wysiwygCommit");
  const btnCancel = document.getElementById("wysiwygCancel");

  if (btnBold) btnBold.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("bold", false, null); });
  if (btnItalic) btnItalic.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("italic", false, null); });
  if (btnUnderline) btnUnderline.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("underline", false, null); });
  if (btnStrikethrough) btnStrikethrough.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("strikeThrough", false, null); });
  if (btnAlignL) btnAlignL.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("justifyLeft", false, null); });
  if (btnAlignC) btnAlignC.addEventListener("mousedown", (e) => { e.preventDefault(); document.execCommand("justifyCenter", false, null); });
  if (inColor) inColor.addEventListener("input", (e) => { document.execCommand("foreColor", false, e.target.value); });
  if (btnCommit) btnCommit.addEventListener("click", commitWysiwygDirect);
  if (btnCancel) btnCancel.addEventListener("click", () => cancelWysiwyg(false));
}

// ==========================================================================
// Helper Functions
// ==========================================================================

async function submitEditText(payload) {
  try {
    const res = await fetch(`/api/document/${state.docId}/edit-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to edit text");
    }
    const data = await res.json();
    showToast(data.message || "Text updated!", "success");
    blockEditorContainer.style.display = "none";
    state.selectedBlock = null;
    await applyMutationResponse(data, state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function rotateCurrentPage(angle) {
  const pageOrder = Array.from({ length: state.totalPages }, (_, i) => i + 1);
  const rotations = {};
  rotations[state.currentPage.toString()] = angle;

  setLoading(true, `Rotating Page ${state.currentPage}...`);
  try {
    const res = await fetch(`/api/document/${state.docId}/organize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_order: pageOrder, rotations: rotations })
    });
    if (!res.ok) throw new Error("Failed to rotate page");
    showToast(`Page ${state.currentPage} rotated by ${angle}°`, "success");
    updateUndoRedoButtons(true, false);
    populateThumbnails();
    await loadPage(state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function duplicateCurrentPage() {
  setLoading(true, "Duplicating page...");
  try {
    const res = await fetch(`/api/document/${state.docId}/page/duplicate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page: state.currentPage })
    });
    if (!res.ok) throw new Error("Duplicate failed");
    const data = await res.json();
    state.docInfo = data.info;
    state.totalPages = data.info.page_count;
    totalPagesSpan.textContent = state.totalPages;
    pageNumberInput.max = state.totalPages;
    updateUndoRedoButtons(true, false);
    updatePageOrderInput();
    populateThumbnails();
    showToast(`Page ${state.currentPage} duplicated!`, "success");
    await loadPage(state.currentPage + 1);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function applyPageOrder(order) {
  if (order.length === 0) return;
  setLoading(true, "Applying page order...");
  try {
    const res = await fetch(`/api/document/${state.docId}/organize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ page_order: order })
    });
    if (!res.ok) throw new Error("Failed to reorder pages");
    const data = await res.json();
    state.docInfo = data.info;
    state.totalPages = data.info.page_count;
    state.currentPage = Math.min(state.currentPage, state.totalPages);
    totalPagesSpan.textContent = state.totalPages;
    pageNumberInput.max = state.totalPages;
    updateUndoRedoButtons(true, false);
    updatePageOrderInput();
    populateThumbnails();
    showToast("Page order applied!", "success");
    await loadPage(state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

function hexToRgb(hex) {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r / 255.0, g / 255.0, b / 255.0];
}

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  a.remove();
}

function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    modal.classList.add("active");
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove("open");
    modal.classList.remove("active");
  }
}

// ==========================================================================
// Advanced 8 Features Implementation
// ==========================================================================

function setupAdvancedFeatures() {
  setupTableExtraction();
  setupPiiScanner();
  setupTextMarkup();
  setupDocumentComparison();
  setupFormatConversions();
  setupMeasurementTools();
  setupPageCroppingAndTrimming();
}

// --------------------------------------------------------------------------
// 1. Table Extraction & Export
// --------------------------------------------------------------------------
function setupTableExtraction() {
  const btnDetectTables = document.getElementById("btnDetectTables");
  const tableDetectionResults = document.getElementById("tableDetectionResults");
  const tableSummaryBadge = document.getElementById("tableSummaryBadge");
  const tablesList = document.getElementById("tablesList");
  const btnCopyTableCsv = document.getElementById("btnCopyTableCsv");
  const btnDownloadTableCsv = document.getElementById("btnDownloadTableCsv");
  const btnDownloadTableExcel = document.getElementById("btnDownloadTableExcel");

  if (btnDetectTables) {
    btnDetectTables.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      setLoading(true, `Detecting tables on page ${state.currentPage}...`);
      try {
        const res = await fetch(`/api/document/${state.docId}/page/${state.currentPage}/tables`);
        if (!res.ok) throw new Error("Failed to detect tables");
        const data = await res.json();
        state.currentTables = data.tables || [];
        
        if (state.currentTables.length === 0) {
          tableDetectionResults.style.display = "block";
          tableSummaryBadge.textContent = "No tabular grids detected on this page.";
          tablesList.innerHTML = `<div class="empty-state">No tables found on page ${state.currentPage}</div>`;
          showToast(`No tables detected on page ${state.currentPage}`, "info");
        } else {
          tableDetectionResults.style.display = "block";
          tableSummaryBadge.textContent = `Found ${state.currentTables.length} table(s) on Page ${state.currentPage}`;
          tablesList.innerHTML = "";
          
          state.currentTables.forEach((tab, idx) => {
            const card = document.createElement("div");
            card.className = "table-item-card";
            card.innerHTML = `
              <div class="table-item-info">
                <strong>Table ${idx + 1}</strong>: ${tab.row_count} rows × ${tab.col_count} cols
              </div>
              <div class="table-item-actions">
                <button class="btn btn-primary btn-sm btn-preview-tab" data-idx="${idx}">Preview &amp; Export</button>
              </div>
            `;
            tablesList.appendChild(card);
          });

          document.querySelectorAll(".btn-preview-tab").forEach(b => {
            b.addEventListener("click", (e) => {
              const tIdx = parseInt(e.currentTarget.dataset.idx);
              openTablePreviewModal(tIdx);
            });
          });
          
          showToast(`Detected ${state.currentTables.length} table(s)!`, "success");
        }
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  function openTablePreviewModal(idx) {
    state.selectedTableIndex = idx;
    const tab = state.currentTables[idx];
    if (!tab) return;
    
    document.getElementById("tableModalTitle").textContent = `Table ${idx + 1} (Page ${tab.page})`;
    document.getElementById("tableMetaBadge").textContent = `${tab.row_count} rows × ${tab.col_count} columns`;
    
    const container = document.getElementById("tableMatrixContainer");
    let html = '<table class="extracted-table"><thead><tr>';
    
    const headers = (tab.header && tab.header.length > 0) ? tab.header : (tab.rows && tab.rows[0] ? tab.rows[0] : []);
    headers.forEach(h => {
      html += `<th>${escapeHtml(h)}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Determine where data rows start: if rows[0] matches header, start at row 1
    let startRow = 0;
    if (tab.rows && tab.rows.length > 0 && headers.length > 0) {
      const isFirstRowHeader = tab.rows[0].every((val, i) => String(val || '').trim() === String(headers[i] || '').trim());
      if (isFirstRowHeader) {
        startRow = 1;
      }
    }
    
    for (let r = startRow; r < (tab.rows ? tab.rows.length : 0); r++) {
      html += '<tr>';
      tab.rows[r].forEach(cell => {
        html += `<td>${escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    container.innerHTML = html;
    
    openModal("tablePreviewModal");
  }

  if (btnCopyTableCsv) {
    btnCopyTableCsv.addEventListener("click", () => {
      const tab = state.currentTables[state.selectedTableIndex];
      if (tab && tab.csv_data) {
        navigator.clipboard.writeText(tab.csv_data);
        showToast("Table CSV copied to clipboard!", "success");
      }
    });
  }

  if (btnDownloadTableCsv) {
    btnDownloadTableCsv.addEventListener("click", async () => {
      const tab = state.currentTables[state.selectedTableIndex];
      if (!tab) return;
      try {
        const res = await fetch(`/api/document/${state.docId}/export-table-csv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tables: [tab] })
        });
        if (!res.ok) throw new Error("Failed to export CSV");
        const blob = await res.blob();
        downloadBlob(blob, `table_page_${tab.page}_${state.selectedTableIndex + 1}.csv`);
        showToast("Table CSV downloaded!", "success");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  if (btnDownloadTableExcel) {
    btnDownloadTableExcel.addEventListener("click", async () => {
      const tab = state.currentTables[state.selectedTableIndex];
      if (!tab) return;
      try {
        const res = await fetch(`/api/document/${state.docId}/export-table-excel`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tables: [tab] })
        });
        if (!res.ok) throw new Error("Failed to export Excel");
        const blob = await res.blob();
        downloadBlob(blob, `table_page_${tab.page}_${state.selectedTableIndex + 1}.xlsx`);
        showToast("Table Excel spreadsheet downloaded!", "success");
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}

// --------------------------------------------------------------------------
// 2. PII Scanner & Auto-Redaction Suite
// --------------------------------------------------------------------------

function renderPiiHighlights() {
  const overlay = document.getElementById("interactiveOverlay");
  if (!overlay) return;
  overlay.querySelectorAll(".pii-canvas-highlight").forEach(el => el.remove());
  if (!state.piiMatches || state.piiMatches.length === 0) return;

  const overlayRect = overlay.getBoundingClientRect();
  if (!overlayRect.width || !overlayRect.height) return;
  const scaleX = overlayRect.width / (state.pageWidthPt || 595);
  const scaleY = overlayRect.height / (state.pageHeightPt || 842);

  state.piiMatches.forEach((m, idx) => {
    if (m.page !== state.currentPage) return;
    if (!m.bbox || m.bbox.length !== 4) return;
    const [x0, y0, x1, y1] = m.bbox;
    const div = document.createElement("div");
    div.className = "pii-canvas-highlight";
    div.dataset.piiIdx = idx;
    div.title = `${m.label || m.type}: ${m.text}`;
    div.style.left = `${x0 * scaleX}px`;
    div.style.top = `${y0 * scaleY}px`;
    div.style.width = `${Math.max(10, (x1 - x0) * scaleX)}px`;
    div.style.height = `${Math.max(10, (y1 - y0) * scaleY)}px`;

    const tag = document.createElement("span");
    tag.className = "pii-canvas-highlight-tag";
    tag.textContent = m.type || "PII";
    div.appendChild(tag);

    div.addEventListener("click", (e) => {
      e.stopPropagation();
      const row = document.querySelector(`.pii-match-row[data-idx="${idx}"]`);
      if (row) {
        document.querySelectorAll(".pii-match-row").forEach(r => r.classList.remove("active"));
        row.classList.add("active");
        row.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });

    overlay.appendChild(div);
  });
}

function setupPiiScanner() {
  const btnScanPII = document.getElementById("btnScanPII");
  const piiResultsContainer = document.getElementById("piiResultsContainer");
  const piiResultsCount = document.getElementById("piiResultsCount");
  const piiMatchesList = document.getElementById("piiMatchesList");
  const btnSelectAllPII = document.getElementById("btnSelectAllPII");
  const btnClearPIIResults = document.getElementById("btnClearPIIResults");
  const btnAutoRedactSelected = document.getElementById("btnAutoRedactSelected");

  let customKeysList = [];
  let customKeywordsList = [];

  // Tag chip rendering helpers
  function renderCustomKeyChips() {
    const container = document.getElementById("customKeysTags");
    if (!container) return;
    container.innerHTML = "";
    customKeysList.forEach((k, idx) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `<span>${escapeHtml(k)}</span><button type="button" class="tag-chip-remove" data-idx="${idx}">&times;</button>`;
      chip.querySelector(".tag-chip-remove").addEventListener("click", () => {
        customKeysList.splice(idx, 1);
        renderCustomKeyChips();
      });
      container.appendChild(chip);
    });
  }

  function renderCustomKeywordChips() {
    const container = document.getElementById("customKeywordsTags");
    if (!container) return;
    container.innerHTML = "";
    customKeywordsList.forEach((kw, idx) => {
      const chip = document.createElement("span");
      chip.className = "tag-chip";
      chip.innerHTML = `<span>${escapeHtml(kw)}</span><button type="button" class="tag-chip-remove" data-idx="${idx}">&times;</button>`;
      chip.querySelector(".tag-chip-remove").addEventListener("click", () => {
        customKeywordsList.splice(idx, 1);
        renderCustomKeywordChips();
      });
      container.appendChild(chip);
    });
  }

  // Key-Value Tag Input
  const inputKey = document.getElementById("inputCustomKey");
  const btnAddKey = document.getElementById("btnAddCustomKey");
  function addKey() {
    if (!inputKey) return;
    const val = inputKey.value.trim();
    if (val && !customKeysList.includes(val)) {
      customKeysList.push(val);
      renderCustomKeyChips();
      inputKey.value = "";
    }
  }
  if (btnAddKey) btnAddKey.addEventListener("click", addKey);
  if (inputKey) {
    inputKey.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addKey();
      }
    });
  }

  // Custom Keyword Tag Input
  const inputKw = document.getElementById("inputCustomKeyword");
  const btnAddKw = document.getElementById("btnAddCustomKeyword");
  function addKw() {
    if (!inputKw) return;
    const val = inputKw.value.trim();
    if (val && !customKeywordsList.includes(val)) {
      customKeywordsList.push(val);
      renderCustomKeywordChips();
      inputKw.value = "";
    }
  }
  if (btnAddKw) btnAddKw.addEventListener("click", addKw);
  if (inputKw) {
    inputKw.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault();
        addKw();
      }
    });
  }

  // Profile Presets
  document.querySelectorAll(".btn-profile-pill").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".btn-profile-pill").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const profile = btn.dataset.profile;

      const setCheck = (id, checked) => {
        const el = document.getElementById(id);
        if (el) el.checked = checked;
      };

      if (profile === "all") {
        setCheck("piiOptEmail", true);
        setCheck("piiOptSSN", true);
        setCheck("piiOptPhone", true);
        setCheck("piiOptCreditCard", true);
        setCheck("piiOptIBAN", false);
        setCheck("piiOptDate", true);
        setCheck("piiOptIP", true);
        setCheck("piiOptSecrets", false);
        setCheck("piiOptPassport", false);
      } else if (profile === "financial") {
        setCheck("piiOptEmail", false);
        setCheck("piiOptSSN", false);
        setCheck("piiOptPhone", false);
        setCheck("piiOptCreditCard", true);
        setCheck("piiOptIBAN", true);
        setCheck("piiOptDate", false);
        setCheck("piiOptIP", false);
        setCheck("piiOptSecrets", false);
        setCheck("piiOptPassport", false);
        ["Account Number", "Routing Number", "Total Due", "Balance", "Cardholder"].forEach(k => {
          if (!customKeysList.includes(k)) customKeysList.push(k);
        });
        renderCustomKeyChips();
      } else if (profile === "healthcare") {
        setCheck("piiOptEmail", false);
        setCheck("piiOptSSN", true);
        setCheck("piiOptPhone", true);
        setCheck("piiOptCreditCard", false);
        setCheck("piiOptIBAN", false);
        setCheck("piiOptDate", true);
        setCheck("piiOptIP", false);
        setCheck("piiOptSecrets", false);
        setCheck("piiOptPassport", false);
        ["Patient Name", "MRN", "Diagnosis", "Insurance Policy", "Doctor", "Date of Birth"].forEach(k => {
          if (!customKeysList.includes(k)) customKeysList.push(k);
        });
        renderCustomKeyChips();
      } else if (profile === "hr") {
        setCheck("piiOptEmail", true);
        setCheck("piiOptSSN", true);
        setCheck("piiOptPhone", true);
        setCheck("piiOptCreditCard", false);
        setCheck("piiOptIBAN", false);
        setCheck("piiOptDate", true);
        setCheck("piiOptIP", false);
        setCheck("piiOptSecrets", false);
        setCheck("piiOptPassport", false);
        ["Employee ID", "Salary", "Gross Pay", "Full Name", "Home Address", "Bank Account"].forEach(k => {
          if (!customKeysList.includes(k)) customKeysList.push(k);
        });
        renderCustomKeyChips();
      } else if (profile === "clear") {
        ["piiOptEmail", "piiOptSSN", "piiOptPhone", "piiOptCreditCard", "piiOptIBAN", "piiOptDate", "piiOptIP", "piiOptSecrets", "piiOptPassport"].forEach(id => setCheck(id, false));
        customKeysList = [];
        customKeywordsList = [];
        renderCustomKeyChips();
        renderCustomKeywordChips();
        const cr = document.getElementById("piiCustomRegex");
        if (cr) cr.value = "";
      }
    });
  });

  // Fill Style Selection
  const fillStyleSelect = document.getElementById("piiFillStyle");
  const fillColorPicker = document.getElementById("piiFillColor");
  if (fillStyleSelect && fillColorPicker) {
    fillStyleSelect.addEventListener("change", () => {
      fillColorPicker.style.display = fillStyleSelect.value === "custom" ? "block" : "none";
    });
  }

  // Clear / Dismiss Results
  if (btnClearPIIResults) {
    btnClearPIIResults.addEventListener("click", () => {
      state.piiMatches = [];
      if (piiResultsContainer) piiResultsContainer.style.display = "none";
      renderPiiHighlights();
    });
  }

  // Scan Trigger
  if (btnScanPII) {
    btnScanPII.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");

      const types = [];
      if (document.getElementById("piiOptEmail")?.checked) types.push("email");
      if (document.getElementById("piiOptSSN")?.checked) types.push("ssn");
      if (document.getElementById("piiOptPhone")?.checked) types.push("phone");
      if (document.getElementById("piiOptCreditCard")?.checked) types.push("credit_card");
      if (document.getElementById("piiOptIBAN")?.checked) types.push("iban");
      if (document.getElementById("piiOptDate")?.checked) types.push("date");
      if (document.getElementById("piiOptIP")?.checked) types.push("ipv4");
      if (document.getElementById("piiOptSecrets")?.checked) types.push("secrets");
      if (document.getElementById("piiOptPassport")?.checked) types.push("passport");

      const keyModeRadio = document.querySelector('input[name="piiKeyMode"]:checked');
      const keyMode = keyModeRadio ? keyModeRadio.value : "value_only";
      const wholeWord = document.getElementById("piiKwWholeWord")?.checked ?? true;
      const caseSensitive = document.getElementById("piiKwCaseSensitive")?.checked ?? false;
      const customPattern = document.getElementById("piiCustomRegex")?.value || "";
      const scope = document.getElementById("piiScanScope")?.value || "all";
      const targetPage = scope === "current" ? state.currentPage : 0;

      setLoading(true, "Scanning document for sensitive data...");
      try {
        const res = await fetch(`/api/document/${state.docId}/scan-pii`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: targetPage,
            types: types,
            custom_keys: customKeysList,
            key_value_mode: keyMode,
            custom_keywords: customKeywordsList,
            match_whole_word: wholeWord,
            case_sensitive: caseSensitive,
            custom_pattern: customPattern
          })
        });
        if (!res.ok) throw new Error("Failed to scan for sensitive items");
        const data = await res.json();
        state.piiMatches = data.matches || [];

        if (piiResultsContainer) piiResultsContainer.style.display = "block";
        if (piiResultsCount) piiResultsCount.textContent = `Found ${state.piiMatches.length} match(es)`;
        if (piiMatchesList) {
          piiMatchesList.innerHTML = "";
          if (state.piiMatches.length === 0) {
            piiMatchesList.innerHTML = '<div class="empty-state" style="padding: 12px; text-align: center; color: var(--text-muted); font-size: 12px;">No sensitive matches found.</div>';
            showToast("No sensitive items detected.", "info");
          } else {
            state.piiMatches.forEach((m, idx) => {
              const row = document.createElement("div");
              row.className = "pii-match-row";
              row.dataset.idx = idx;
              const badgeClass = `pii-badge-${m.type || 'custom_regex'}`;
              row.innerHTML = `
                <input type="checkbox" class="pii-item-checkbox" data-idx="${idx}" checked />
                <span class="pii-badge ${badgeClass}">${escapeHtml(m.type || 'MATCH')}</span>
                <span class="pii-text-val" title="${escapeHtml(m.text)}">P.${m.page}: ${escapeHtml(m.text)}</span>
              `;

              row.addEventListener("click", async (e) => {
                if (e.target.tagName === "INPUT") return;
                document.querySelectorAll(".pii-match-row").forEach(r => r.classList.remove("active"));
                row.classList.add("active");

                if (m.page !== state.currentPage) {
                  await loadPage(m.page);
                }

                // Highlight corresponding canvas box
                document.querySelectorAll(".pii-canvas-highlight").forEach(box => {
                  if (parseInt(box.dataset.piiIdx) === idx) {
                    box.classList.add("focused");
                    box.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
                  } else {
                    box.classList.remove("focused");
                  }
                });
              });

              piiMatchesList.appendChild(row);
            });
            showToast(`Found ${state.piiMatches.length} sensitive item(s)!`, "success");
          }
        }
        renderPiiHighlights();
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  // Toggle All Checkboxes
  if (btnSelectAllPII) {
    btnSelectAllPII.addEventListener("click", () => {
      const cbs = document.querySelectorAll(".pii-item-checkbox");
      if (cbs.length === 0) return;
      const allChecked = Array.from(cbs).every(cb => cb.checked);
      cbs.forEach(cb => cb.checked = !allChecked);
    });
  }

  // Auto-Redact Selected Items
  if (btnAutoRedactSelected) {
    btnAutoRedactSelected.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      const cbs = document.querySelectorAll(".pii-item-checkbox:checked");
      if (cbs.length === 0) return showToast("Please select at least one match to redact.", "error");

      const selectedItems = Array.from(cbs).map(cb => state.piiMatches[parseInt(cb.dataset.idx)]);
      const label = document.getElementById("piiRedactLabel")?.value || "";
      const fillStyle = document.getElementById("piiFillStyle")?.value || "black";
      let fillColor = [0.0, 0.0, 0.0];
      let textColor = [1.0, 1.0, 1.0];
      if (fillStyle === "white") {
        fillColor = [1.0, 1.0, 1.0];
        textColor = [0.0, 0.0, 0.0];
      } else if (fillStyle === "custom") {
        const hex = document.getElementById("piiFillColor")?.value || "#000000";
        fillColor = hexToRgb(hex);
      }

      const sanitize = document.getElementById("piiSanitizeDoc")?.checked ?? true;

      showConfirmModal(
        "Apply Permanent Redaction",
        `Permanently redact ${selectedItems.length} selected item(s) from document? This will permanently erase underlying vector text and sanitize metadata.`,
        async () => {
          setLoading(true, "Applying permanent redactions & sanitizing...");
          try {
            const res = await fetch(`/api/document/${state.docId}/auto-redact-pii`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                items: selectedItems,
                label: label,
                fill_color: fillColor,
                text_color: textColor,
                sanitize_metadata: sanitize
              })
            });
            if (!res.ok) throw new Error("Failed to auto-redact items");
            const data = await res.json();
            updateUndoRedoButtons(true, false);
            showToast(data.message || "Sensitive items redacted successfully!", "success");
            if (piiResultsContainer) piiResultsContainer.style.display = "none";
            state.piiMatches = [];
            renderPiiHighlights();
            await loadPage(state.currentPage);
          } catch (err) {
            showToast(err.message, "error");
          } finally {
            setLoading(false);
          }
        }
      );
    });
  }
}

// --------------------------------------------------------------------------
// 3. Text Markup Suite (Highlight, Underline, Strikeout, Squiggly)
// --------------------------------------------------------------------------
function setupTextMarkup() {
  const markupButtons = document.querySelectorAll(".markup-type-btn");
  const btnApplyTextMarkup = document.getElementById("btnApplyTextMarkup");
  const markupColorInput = document.getElementById("markupColor");
  const markupSearchInput = document.getElementById("markupSearchText");

  markupButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      markupButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      state.activeMarkupType = btn.dataset.markup;
      
      if (state.activeMarkupType === "highlight") markupColorInput.value = "#fef08a";
      else if (state.activeMarkupType === "underline") markupColorInput.value = "#16a34a";
      else if (state.activeMarkupType === "strikeout") markupColorInput.value = "#dc2626";
      else if (state.activeMarkupType === "squiggly") markupColorInput.value = "#9333ea";
    });
  });

  if (btnApplyTextMarkup) {
    btnApplyTextMarkup.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      const searchText = markupSearchInput?.value?.trim();
      let bboxes = null;

      if (!searchText && state.selectedBlock) {
        bboxes = [state.selectedBlock.bbox];
      }

      if (!searchText && !bboxes) {
        return showToast("Please enter search text to markup or select a text block.", "error");
      }

      const colorRgb = hexToRgb(markupColorInput?.value || "#fef08a");
      setLoading(true, `Applying ${state.activeMarkupType} markup...`);
      try {
        const res = await fetch(`/api/document/${state.docId}/add-markup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: state.currentPage,
            type: state.activeMarkupType,
            search_text: searchText || null,
            bboxes: bboxes,
            color: colorRgb
          })
        });
        if (!res.ok) throw new Error("Failed to apply text markup");
        const data = await res.json();
        updateUndoRedoButtons(true, false);
        showToast(data.message || "Markup applied!", "success");
        if (markupSearchInput) markupSearchInput.value = "";
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }
}

// --------------------------------------------------------------------------
// 4. Document Comparison Modal
// --------------------------------------------------------------------------
function setupDocumentComparison() {
  const btnTopCompare = document.getElementById("btnTopCompare");
  const compareFileInput = document.getElementById("compareFileInput");
  const btnRunComparison = document.getElementById("btnRunComparison");
  const compareResultsSection = document.getElementById("compareResultsSection");
  const compareScoreBadge = document.getElementById("compareScoreBadge");
  const cmpSideWrap = document.getElementById("cmpSideWrap");
  const cmpDiffWrap = document.getElementById("cmpDiffWrap");
  const cmpImgA = document.getElementById("cmpImgA");
  const cmpImgB = document.getElementById("cmpImgB");
  const cmpImgDiff = document.getElementById("cmpImgDiff");
  const viewBtns = document.querySelectorAll(".cmp-view-btn");

  if (btnTopCompare) {
    btnTopCompare.addEventListener("click", () => {
      if (!state.docId) return showToast("Upload a document first to compare.", "error");
      document.getElementById("comparePageA").value = state.currentPage;
      document.getElementById("comparePageB").value = state.currentPage;
      compareResultsSection.style.display = "none";
      openModal("compareModal");
    });
  }

  viewBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      viewBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.view;
      if (mode === "side-by-side") {
        cmpSideWrap.style.display = "grid";
        cmpDiffWrap.style.display = "none";
      } else {
        cmpSideWrap.style.display = "none";
        cmpDiffWrap.style.display = "block";
      }
    });
  });

  if (btnRunComparison) {
    btnRunComparison.addEventListener("click", async () => {
      if (!state.docId) return showToast("No primary document loaded", "error");
      if (!compareFileInput.files || compareFileInput.files.length === 0) {
        return showToast("Please choose a comparison PDF file.", "error");
      }

      const pA = parseInt(document.getElementById("comparePageA")?.value || 1);
      const pB = parseInt(document.getElementById("comparePageB")?.value || 1);

      const formData = new FormData();
      formData.append("file", compareFileInput.files[0]);
      formData.append("page_a", pA);
      formData.append("page_b", pB);
      formData.append("zoom", 1.5);

      setLoading(true, "Comparing documents pixel-by-pixel...");
      try {
        const res = await fetch(`/api/document/${state.docId}/compare`, {
          method: "POST",
          body: formData
        });
        if (!res.ok) throw new Error("Failed to compare documents");
        const data = await res.json();

        compareResultsSection.style.display = "block";
        compareScoreBadge.textContent = `Visual Similarity: ${data.similarity_score}% (${data.diff_pixels.toLocaleString()} changed pixels)`;
        if (data.similarity_score > 98) {
          compareScoreBadge.style.backgroundColor = "var(--success-light)";
          compareScoreBadge.style.color = "#047857";
        } else {
          compareScoreBadge.style.backgroundColor = "var(--warning-light)";
          compareScoreBadge.style.color = "#b45309";
        }

        cmpImgA.src = data.image_a;
        cmpImgB.src = data.image_b;
        cmpImgDiff.src = data.diff_image;

        showToast(`Comparison complete: ${data.similarity_score}% similarity`, "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }
}

// --------------------------------------------------------------------------
// 5. Format Conversions
// --------------------------------------------------------------------------
function setupFormatConversions() {
  const imagesToPdfInput = document.getElementById("imagesToPdfInput");
  const imagesToPdfFileList = document.getElementById("imagesToPdfFileList");
  const btnConvertImagesToPdf = document.getElementById("btnConvertImagesToPdf");
  const btnExportPdfImagesZip = document.getElementById("btnExportPdfImagesZip");

  // Document export buttons
  const btnConvertToWord = document.getElementById("btnConvertToWord");
  const btnConvertToExcel = document.getElementById("btnConvertToExcel");
  const btnConvertToPptx = document.getElementById("btnConvertToPptx");
  const btnConvertToPdfa = document.getElementById("btnConvertToPdfa");

  // Office to PDF buttons & inputs
  const inputWordToPdf = document.getElementById("inputWordToPdf");
  const btnConvertWordToPdf = document.getElementById("btnConvertWordToPdf");

  const inputExcelToPdf = document.getElementById("inputExcelToPdf");
  const btnConvertExcelToPdf = document.getElementById("btnConvertExcelToPdf");

  const inputPptxToPdf = document.getElementById("inputPptxToPdf");
  const btnConvertPptxToPdf = document.getElementById("btnConvertPptxToPdf");

  let isConverting = false;

  if (imagesToPdfInput && imagesToPdfFileList) {
    imagesToPdfInput.addEventListener("change", (e) => {
      imagesToPdfFileList.innerHTML = "";
      Array.from(e.target.files).forEach((f, i) => {
        const row = document.createElement("div");
        row.className = "queue-item";
        row.innerHTML = `<span>${i + 1}. ${escapeHtml(f.name)} (${Math.round(f.size / 1024)} KB)</span>`;
        imagesToPdfFileList.appendChild(row);
      });
    });
  }

  if (btnConvertImagesToPdf) {
    btnConvertImagesToPdf.addEventListener("click", async () => {
      if (isConverting) return;
      if (!imagesToPdfInput.files || imagesToPdfInput.files.length === 0) {
        return showToast("Please select at least one image file.", "error");
      }
      isConverting = true;
      setLoading(true, "Converting images to PDF...");
      const formData = new FormData();
      Array.from(imagesToPdfInput.files).forEach(f => formData.append("files", f));
      try {
        const res = await fetch("/api/convert-images-to-pdf", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Failed to convert images to PDF");
        const blob = await res.blob();
        downloadBlob(blob, "converted_images.pdf");
        showToast("Images converted and downloaded!", "success");
        imagesToPdfInput.value = "";
        imagesToPdfFileList.innerHTML = "";
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        isConverting = false;
        setLoading(false);
      }
    });
  }

  if (btnExportPdfImagesZip) {
    btnExportPdfImagesZip.addEventListener("click", async () => {
      if (isConverting) return;
      if (!state.docId) return showToast("No document loaded", "error");
      isConverting = true;
      const dpi = document.getElementById("exportImageDpi")?.value || 150;
      const fmt = document.getElementById("exportImageFormat")?.value || "png";
      setLoading(true, "Rendering pages to high-res images ZIP...");
      try {
        const res = await fetch(`/api/document/${state.docId}/convert-to-images?dpi=${dpi}&format=${fmt}`);
        if (!res.ok) throw new Error("Failed to export images ZIP");
        const blob = await res.blob();
        downloadBlob(blob, `images_${state.filename || 'doc'}.zip`);
        showToast("All pages exported as ZIP!", "success");
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        isConverting = false;
        setLoading(false);
      }
    });
  }

  async function exportActiveDoc(formatName, endpoint, ext) {
    if (isConverting) return;
    if (!state.docId) {
      showToast("Please open a PDF document in the studio first.", "error");
      return;
    }
    isConverting = true;
    const baseName = (state.filename || "document").replace(/\.[^/.]+$/, "");
    setLoading(true, `Converting PDF to ${formatName}...`);
    try {
      const res = await fetch(`/api/document/${state.docId}/${endpoint}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Failed to convert document to ${formatName}`);
      }
      const blob = await res.blob();
      downloadBlob(blob, `${baseName}.${ext}`);
      showToast(`${formatName} conversion complete!`, "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      isConverting = false;
      setLoading(false);
    }
  }

  async function showConversionFeasibility(targetFormat) {
    if (!state.docId) {
      showToast("Please open a PDF document in the studio first.", "error");
      return;
    }

    const modal = document.getElementById("conversionFeasibilityModal");
    const loadingState = document.getElementById("feasibilityLoadingState");
    const resultState = document.getElementById("feasibilityResultState");
    const titleEl = document.getElementById("feasibilityModalTitle");
    const targetLabel = document.getElementById("feasibilityTargetLabel");
    const iconBadge = document.getElementById("feasibilityHeaderIcon");
    const badgeEl = document.getElementById("feasibilityBadge");
    const scoreNumEl = document.getElementById("feasibilityScoreNumber");
    const meterFill = document.getElementById("feasibilityMeterFill");
    const inferenceEl = document.getElementById("feasibilityInferenceText");
    const metricPages = document.getElementById("fMetricPages");
    const metricOrientation = document.getElementById("fMetricOrientation");
    const metricTables = document.getElementById("fMetricTables");
    const metricRows = document.getElementById("fMetricRows");
    const metricHeadings = document.getElementById("fMetricHeadings");
    const metricBullets = document.getElementById("fMetricBullets");
    const metricDensity = document.getElementById("fMetricDensity");
    const metricDataRatio = document.getElementById("fMetricDataRatio");
    const headingsLabel = document.getElementById("fMetricHeadingsLabel");
    const modeContainer = document.getElementById("feasibilityModeOptions");
    const btnProceed = document.getElementById("btnProceedConversion");
    const btnProceedText = document.getElementById("btnProceedConversionText");

    const isPpt = targetFormat === "pptx";
    const formatName = isPpt ? "PowerPoint (.pptx)" : "Excel (.xlsx)";
    const ext = isPpt ? "pptx" : "xlsx";

    if (titleEl) titleEl.textContent = `${isPpt ? "PowerPoint" : "Excel"} Conversion Feasibility & Inference`;
    if (targetLabel) targetLabel.textContent = `Analyzing "${escapeHtml(state.filename || 'document.pdf')}" layout structure`;

    if (iconBadge) {
      iconBadge.style.color = isPpt ? "#f59e0b" : "#10b981";
      iconBadge.style.background = isPpt ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)";
    }

    if (loadingState) loadingState.style.display = "flex";
    if (resultState) resultState.style.display = "none";
    if (btnProceed) btnProceed.disabled = true;
    if (btnProceedText) btnProceedText.textContent = `Convert & Download ${isPpt ? 'PowerPoint' : 'Excel'}`;

    if (modal) modal.classList.add("open");

    try {
      const res = await fetch(`/api/document/${state.docId}/conversion-feasibility?target=${targetFormat}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to inspect conversion feasibility");
      }
      const data = await res.json();

      const m = data.metrics || {};
      if (metricPages) metricPages.textContent = `${m.page_count || 1} ${m.page_count === 1 ? 'Page' : 'Pages'}`;
      if (metricOrientation) metricOrientation.textContent = m.orientation || "Portrait";
      if (metricTables) metricTables.textContent = `${m.tables_detected || 0} ${m.tables_detected === 1 ? 'Table' : 'Tables'}`;
      if (metricRows) metricRows.textContent = `${m.total_table_rows || 0} Data Rows`;

      if (isPpt) {
        if (headingsLabel) headingsLabel.textContent = "Slide Headings";
        if (metricHeadings) metricHeadings.textContent = `${m.headings_detected || 0} Headings`;
        if (metricBullets) metricBullets.textContent = `${m.bullets_detected || 0} Bullets`;
      } else {
        if (headingsLabel) headingsLabel.textContent = "Data Columns";
        if (metricHeadings) metricHeadings.textContent = `${m.total_table_cols || 0} Cols Max`;
        if (metricBullets) metricBullets.textContent = `${m.page_count || 1} Worksheets`;
      }

      if (metricDensity) metricDensity.textContent = `${m.avg_words_per_page || 0} w/pg`;
      if (metricDataRatio) metricDataRatio.textContent = `${m.tabular_data_ratio || '0%'} Tabular`;

      const score = data.feasibility_score || 50;
      const level = data.feasibility_level || "moderate";
      if (scoreNumEl) scoreNumEl.textContent = `${score}%`;
      if (meterFill) {
        meterFill.style.width = `${score}%`;
        meterFill.className = `feasibility-meter-fill meter-${level}`;
      }

      if (badgeEl) {
        badgeEl.textContent = data.feasibility_label || `${level.toUpperCase()} FEASIBILITY`;
        badgeEl.className = `badge ${level === 'high' ? 'badge-success' : (level === 'moderate' ? 'badge-warning' : 'badge-danger')}`;
      }

      if (inferenceEl) inferenceEl.textContent = data.inference || "Feasibility check completed.";

      if (modeContainer) {
        modeContainer.innerHTML = "";
        const options = data.conversion_options || [];
        options.forEach((opt) => {
          const card = document.createElement("label");
          card.className = `mode-option-card ${opt.default ? 'active' : ''}`;
          card.innerHTML = `
            <input type="radio" name="conversionModeRadio" value="${opt.id}" ${opt.default ? 'checked' : ''} class="mode-option-radio" />
            <div class="mode-option-content">
              <div class="mode-option-title">
                <span>${escapeHtml(opt.name)}</span>
                ${opt.default ? '<span class="badge badge-primary" style="font-size:10px; padding: 2px 6px;">Recommended</span>' : ''}
              </div>
              <p class="mode-option-desc">${escapeHtml(opt.description)}</p>
            </div>
          `;
          card.addEventListener("click", () => {
            document.querySelectorAll(".mode-option-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            const radio = card.querySelector("input[type='radio']");
            if (radio) radio.checked = true;
          });
          modeContainer.appendChild(card);
        });
      }

      if (btnProceed) {
        btnProceed.disabled = false;
        btnProceed.onclick = async () => {
          const selectedRadio = document.querySelector("input[name='conversionModeRadio']:checked");
          const mode = selectedRadio ? selectedRadio.value : (isPpt ? "structured" : "multi_sheet");
          closeModal("conversionFeasibilityModal");
          await exportActiveDoc(formatName, isPpt ? `convert-to-pptx?mode=${mode}` : `convert-to-excel?mode=${mode}`, ext);
        };
      }

      if (loadingState) loadingState.style.display = "none";
      if (resultState) resultState.style.display = "block";
    } catch (err) {
      if (loadingState) loadingState.style.display = "none";
      showToast(err.message, "error");
      closeModal("conversionFeasibilityModal");
    }
  }

  if (btnConvertToWord) {
    btnConvertToWord.addEventListener("click", () => {
      exportActiveDoc("Word (.docx)", "convert-to-word", "docx");
    });
  }

  if (btnConvertToExcel) {
    btnConvertToExcel.addEventListener("click", () => {
      showConversionFeasibility("excel");
    });
  }

  if (btnConvertToPptx) {
    btnConvertToPptx.addEventListener("click", () => {
      showConversionFeasibility("pptx");
    });
  }

  if (btnConvertToPdfa) {
    btnConvertToPdfa.addEventListener("click", () => {
      exportActiveDoc("PDF/A", "convert-to-pdfa?level=2b", "pdf");
    });
  }

  async function convertOfficeFile(inputEl, endpoint, targetName) {
    if (isConverting) return;
    if (!inputEl || !inputEl.files || inputEl.files.length === 0) {
      showToast("Please choose a file to convert.", "error");
      return;
    }
    const file = inputEl.files[0];
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    isConverting = true;
    setLoading(true, `Converting ${file.name} to PDF...`);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(endpoint, { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Conversion to PDF failed`);
      }
      const blob = await res.blob();
      downloadBlob(blob, `${baseName}.pdf`);
      showToast(`Successfully converted ${file.name} to PDF!`, "success");
      inputEl.value = "";
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      isConverting = false;
      setLoading(false);
    }
  }

  if (btnConvertWordToPdf && inputWordToPdf) {
    btnConvertWordToPdf.addEventListener("click", () => {
      convertOfficeFile(inputWordToPdf, "/api/convert-docx-to-pdf", "Word");
    });
  }

  if (btnConvertExcelToPdf && inputExcelToPdf) {
    btnConvertExcelToPdf.addEventListener("click", () => {
      convertOfficeFile(inputExcelToPdf, "/api/convert-excel-to-pdf", "Excel");
    });
  }

  if (btnConvertPptxToPdf && inputPptxToPdf) {
    btnConvertPptxToPdf.addEventListener("click", () => {
      convertOfficeFile(inputPptxToPdf, "/api/convert-pptx-to-pdf", "PowerPoint");
    });
  }
}

// --------------------------------------------------------------------------
// 6. Shapes Sub-Mode (Add Shapes vs Ruler/Polygon) & Measurement Tools
// --------------------------------------------------------------------------

window.setShapesSubMode = function(mode, subType = null) {
  state.shapesSubMode = mode;
  const btnModeAddShapes = document.getElementById("btnModeAddShapes");
  const btnModeMeasureRuler = document.getElementById("btnModeMeasureRuler");
  const shapesDrawSection = document.getElementById("shapesDrawSection");
  const shapesMeasureSection = document.getElementById("shapesMeasureSection");
  const btnMeasureDistance = document.getElementById("btnMeasureDistance");
  const btnMeasureArea = document.getElementById("btnMeasureArea");

  if (mode === "shapes") {
    cancelMeasurement();
    if (btnModeAddShapes) btnModeAddShapes.classList.add("active");
    if (btnModeMeasureRuler) btnModeMeasureRuler.classList.remove("active");
    if (shapesDrawSection) shapesDrawSection.style.display = "block";
    if (shapesMeasureSection) shapesMeasureSection.style.display = "none";
    if (state.activeTab === "tab-shapes") {
      interactiveOverlay.style.cursor = "crosshair";
    }
  } else if (mode === "ruler") {
    document.querySelectorAll(".shape-preview-box").forEach(b => b.remove());
    if (btnModeAddShapes) btnModeAddShapes.classList.remove("active");
    if (btnModeMeasureRuler) btnModeMeasureRuler.classList.add("active");
    if (shapesDrawSection) shapesDrawSection.style.display = "none";
    if (shapesMeasureSection) shapesMeasureSection.style.display = "block";

    const targetType = subType || (btnMeasureArea && btnMeasureArea.classList.contains("active") ? "area" : "distance");
    activateMeasurementTool(targetType);
    if (state.activeTab === "tab-shapes") {
      interactiveOverlay.style.cursor = "crosshair";
    }
  }
};

function activateMeasurementTool(type) {
  state.measureMode = type;
  state.measurePoints = [];
  document.querySelectorAll(".measurement-badge, .measurement-svg-layer").forEach(el => el.remove());

  const btnMeasureDistance = document.getElementById("btnMeasureDistance");
  const btnMeasureArea = document.getElementById("btnMeasureArea");
  const measureModeLabel = document.getElementById("measureModeLabel");
  const measureValueLabel = document.getElementById("measureValueLabel");

  if (type === "distance") {
    if (btnMeasureDistance) btnMeasureDistance.classList.add("active");
    if (btnMeasureArea) btnMeasureArea.classList.remove("active");
    if (measureModeLabel) measureModeLabel.textContent = "Distance Ruler (2 points)";
    if (measureValueLabel) measureValueLabel.textContent = "Click Point 1 on PDF...";
  } else if (type === "area") {
    if (btnMeasureArea) btnMeasureArea.classList.add("active");
    if (btnMeasureDistance) btnMeasureDistance.classList.remove("active");
    if (measureModeLabel) measureModeLabel.textContent = "Area Polygon (Click points)";
    if (measureValueLabel) measureValueLabel.textContent = "Click points on PDF (Click point 1 to close)...";
  }
}

function cancelMeasurement() {
  state.measureMode = null;
  state.measurePoints = [];
  document.querySelectorAll(".measure-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".measurement-badge, .measurement-svg-layer").forEach(el => el.remove());
}

function setupMeasurementTools() {
  const btnMeasureDistance = document.getElementById("btnMeasureDistance");
  const btnMeasureArea = document.getElementById("btnMeasureArea");
  const measureUnitSelect = document.getElementById("measureUnit");
  const measureScaleInput = document.getElementById("measureScale");
  const btnCancelMeasure = document.getElementById("btnCancelMeasure");
  const btnClearCurrentMeasure = document.getElementById("btnClearCurrentMeasure");
  const btnModeAddShapes = document.getElementById("btnModeAddShapes");
  const btnModeMeasureRuler = document.getElementById("btnModeMeasureRuler");
  const shapesDrawSection = document.getElementById("shapesDrawSection");

  // Mode switcher tabs
  if (btnModeAddShapes) {
    btnModeAddShapes.addEventListener("click", () => {
      window.setShapesSubMode("shapes");
      showToast("Switched to Add Shapes mode. Drag on canvas to draw.", "info");
    });
  }

  if (btnModeMeasureRuler) {
    btnModeMeasureRuler.addEventListener("click", () => {
      window.setShapesSubMode("ruler");
      showToast("Switched to Ruler & Polygon mode. Click on canvas to measure.", "info");
    });
  }

  // Auto-switch to Add Shapes if user focuses or clicks inside shape drawing panel
  if (shapesDrawSection) {
    shapesDrawSection.addEventListener("click", (e) => {
      if (state.shapesSubMode !== "shapes" && !e.target.closest("#btnApplyShape")) {
        window.setShapesSubMode("shapes");
      }
    });
    ["shapeType", "shapeColor", "shapeFill", "shapeWidth", "shapeStartX", "shapeStartY", "shapeEndX", "shapeEndY"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener("focus", () => {
          if (state.shapesSubMode !== "shapes") window.setShapesSubMode("shapes");
        });
      }
    });

    ["shapeType", "shapeColor", "shapeFill", "shapeWidth"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const syncActive = () => {
          if (activeTransformBox && activeTransformBox.classList.contains("mode-shape") && typeof activeTransformBox._syncFromSidebar === "function") {
            activeTransformBox._syncFromSidebar();
          }
        };
        el.addEventListener("input", syncActive);
        el.addEventListener("change", syncActive);
      }
    });

    ["shapeStartX", "shapeStartY", "shapeEndX", "shapeEndY"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        const syncCoords = () => {
          if (activeTransformBox && activeTransformBox.classList.contains("mode-shape") && typeof activeTransformBox._syncCoordsFromSidebar === "function") {
            activeTransformBox._syncCoordsFromSidebar();
          }
        };
        el.addEventListener("input", syncCoords);
        el.addEventListener("change", syncCoords);
      }
    });
  }

  // Distance vs Area tools inside Ruler mode
  if (btnMeasureDistance) {
    btnMeasureDistance.addEventListener("click", () => {
      window.setShapesSubMode("ruler", "distance");
      showToast("Distance Ruler activated. Click 2 points on page.", "info");
    });
  }

  if (btnMeasureArea) {
    btnMeasureArea.addEventListener("click", () => {
      window.setShapesSubMode("ruler", "area");
      showToast("Polygon Area activated. Click points on page.", "info");
    });
  }

  // Switch back to Add Shapes from readout card
  if (btnCancelMeasure) {
    btnCancelMeasure.addEventListener("click", () => {
      window.setShapesSubMode("shapes");
      showToast("Switched back to Add Shapes mode.", "info");
    });
  }

  // Clear current points to take a new measurement
  if (btnClearCurrentMeasure) {
    btnClearCurrentMeasure.addEventListener("click", () => {
      state.measurePoints = [];
      document.querySelectorAll(".measurement-badge, .measurement-svg-layer").forEach(el => el.remove());
      activateMeasurementTool(state.measureMode || "distance");
      showToast("Measurement points cleared.", "info");
    });
  }

  if (measureUnitSelect) {
    measureUnitSelect.addEventListener("change", (e) => {
      state.measureUnit = e.target.value;
      updateMeasurementReadout();
    });
  }

  if (measureScaleInput) {
    measureScaleInput.addEventListener("change", (e) => {
      state.measureScale = parseFloat(e.target.value) || 1.0;
      updateMeasurementReadout();
    });
  }
}

function handleMeasurementClick(pt) {
  if (!state.measureMode) return;
  state.measurePoints.push(pt);
  
  if (state.measureMode === "distance") {
    if (state.measurePoints.length === 1) {
      document.getElementById("measureValueLabel").textContent = "Point 1 set. Click Point 2...";
      renderMeasurementVisuals();
    } else if (state.measurePoints.length >= 2) {
      updateMeasurementReadout();
      renderMeasurementVisuals();
      state.measurePoints = [];
    }
  } else if (state.measureMode === "area") {
    updateMeasurementReadout();
    renderMeasurementVisuals();
  }
}

function updateMeasurementReadout() {
  const pts = state.measurePoints;
  const unit = state.measureUnit || "in";
  const scale = state.measureScale || 1.0;
  
  let ptToUnit = 1 / 72.0;
  if (unit === "pt") ptToUnit = 1.0;
  else if (unit === "in") ptToUnit = 1 / 72.0;
  else if (unit === "mm") ptToUnit = 25.4 / 72.0;
  else if (unit === "cm") ptToUnit = 2.54 / 72.0;
  else if (unit === "ft") ptToUnit = 1 / (72.0 * 12.0);
  else if (unit === "m") ptToUnit = 0.0254 / 72.0;

  const unitFactor = ptToUnit * scale;

  if (state.measureMode === "distance" && pts.length >= 2) {
    const p1 = pts[pts.length - 2];
    const p2 = pts[pts.length - 1];
    const distPt = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const distVal = (distPt * unitFactor).toFixed(2);
    document.getElementById("measureValueLabel").textContent = `${distVal} ${unit}`;
  } else if (state.measureMode === "area" && pts.length >= 3) {
    let areaPt = 0;
    let perimeterPt = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      areaPt += pts[i].x * pts[j].y;
      areaPt -= pts[j].x * pts[i].y;
      perimeterPt += Math.hypot(pts[j].x - pts[i].x, pts[j].y - pts[i].y);
    }
    areaPt = Math.abs(areaPt) / 2.0;
    const areaVal = (areaPt * unitFactor * unitFactor).toFixed(2);
    const perimVal = (perimeterPt * unitFactor).toFixed(2);
    document.getElementById("measureValueLabel").textContent = `${areaVal} sq ${unit} (Perimeter: ${perimVal} ${unit})`;
  }
}

function renderMeasurementVisuals() {
  document.querySelectorAll(".measurement-badge, .measurement-svg-layer").forEach(el => el.remove());
  if (state.measurePoints.length === 0) return;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "measurement-svg-layer");
  svg.style.position = "absolute";
  svg.style.top = "0";
  svg.style.left = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.pointerEvents = "none";
  svg.style.zIndex = "21";

  const pts = state.measurePoints;
  const overlayRect = interactiveOverlay.getBoundingClientRect();
  const scaleX = overlayRect.width / state.pageWidthPt;
  const scaleY = overlayRect.height / state.pageHeightPt;

  if (state.measureMode === "distance") {
    if (pts.length === 1) {
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", pts[0].x * scaleX);
      circle.setAttribute("cy", pts[0].y * scaleY);
      circle.setAttribute("r", "5");
      circle.setAttribute("fill", "#2563eb");
      svg.appendChild(circle);
    } else if (pts.length >= 2) {
      const p1 = pts[pts.length - 2];
      const p2 = pts[pts.length - 1];
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", p1.x * scaleX);
      line.setAttribute("y1", p1.y * scaleY);
      line.setAttribute("x2", p2.x * scaleX);
      line.setAttribute("y2", p2.y * scaleY);
      line.setAttribute("stroke", "#2563eb");
      line.setAttribute("stroke-width", "2.5");
      line.setAttribute("stroke-dasharray", "4");
      svg.appendChild(line);

      const midX = ((p1.x + p2.x) / 2) * scaleX;
      const midY = ((p1.y + p2.y) / 2) * scaleY;
      const badge = document.createElement("div");
      badge.className = "measurement-badge";
      badge.style.left = `${midX}px`;
      badge.style.top = `${midY}px`;
      badge.textContent = document.getElementById("measureValueLabel")?.textContent || "";
      interactiveOverlay.appendChild(badge);
    }
  } else if (state.measureMode === "area") {
    if (pts.length >= 2) {
      const poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const pointsStr = pts.map(p => `${p.x * scaleX},${p.y * scaleY}`).join(" ");
      poly.setAttribute("points", pointsStr);
      poly.setAttribute("stroke", "#9333ea");
      poly.setAttribute("stroke-width", "2");
      poly.setAttribute("fill", "rgba(147, 51, 234, 0.2)");
      svg.appendChild(poly);
    }
  }
  interactiveOverlay.appendChild(svg);
}

// --------------------------------------------------------------------------
// 7 & 8. Page Cropping & Margin Trimming (SmallPDF Visual Parity)
// --------------------------------------------------------------------------

function cancelVisualCrop() {
  state.isVisualCropping = false;
  if (activeCropBox) {
    activeCropBox.remove();
    activeCropBox = null;
  }
  const btn = document.getElementById("btnStartVisualCrop");
  if (btn) btn.classList.remove("active");
  const card = document.getElementById("visualCropActiveCard");
  if (card) card.style.display = "none";
}

function updateCropToolbarPosition() {
  if (!activeCropBox) return;
  const toolbar = activeCropBox.querySelector(".crop-floating-toolbar");
  const pill = activeCropBox.querySelector(".crop-top-pill");
  if (!toolbar) return;

  const viewportEl = document.getElementById("canvasViewport");
  const viewportRect = viewportEl ? viewportEl.getBoundingClientRect() : {
    left: 0,
    right: window.innerWidth,
    top: 0,
    bottom: window.innerHeight,
    width: window.innerWidth,
    height: window.innerHeight
  };
  const boxRect = activeCropBox.getBoundingClientRect();
  const tbRect = toolbar.getBoundingClientRect();
  const tbWidth = tbRect.width > 0 ? tbRect.width : (toolbar.offsetWidth || 340);
  const tbHeight = tbRect.height > 0 ? tbRect.height : (toolbar.offsetHeight || 36);

  // Vertical placement: Above vs Below
  const spaceBelow = Math.min(viewportRect.bottom, window.innerHeight) - boxRect.bottom - 10;
  const spaceAbove = boxRect.top - Math.max(viewportRect.top, 0) - 10;

  if (spaceBelow < (tbHeight + 15) && spaceAbove >= (tbHeight + 35)) {
    toolbar.classList.add("toolbar-above");
  } else {
    toolbar.classList.remove("toolbar-above");
  }

  // Horizontal clamping within visible viewport
  const padding = 10;
  const availWidth = Math.max(260, viewportRect.width - padding * 2);
  const effectiveTbWidth = Math.min(tbWidth, availWidth);

  const screenMinX = viewportRect.left + padding;
  const screenMaxX = viewportRect.right - padding - effectiveTbWidth;

  const idealCenter = boxRect.left + (boxRect.width / 2);
  const idealScreenLeft = idealCenter - (effectiveTbWidth / 2);

  let clampedScreenLeft;
  if (screenMaxX <= screenMinX) {
    clampedScreenLeft = screenMinX;
  } else {
    clampedScreenLeft = Math.max(screenMinX, Math.min(idealScreenLeft, screenMaxX));
  }

  const relLeft = clampedScreenLeft - boxRect.left;
  toolbar.style.left = `${Math.round(relLeft)}px`;
  toolbar.style.transform = "none";
  toolbar.style.maxWidth = `${Math.floor(availWidth)}px`;

  // Pill clamping
  if (pill) {
    const pillRect = pill.getBoundingClientRect();
    const pillWidth = pillRect.width > 0 ? pillRect.width : (pill.offsetWidth || 180);
    const pillMaxX = Math.min(viewportRect.right - padding, window.innerWidth - padding) - pillWidth;
    const pillMinX = Math.max(viewportRect.left + padding, padding);
    const idealPillLeft = boxRect.left;
    const clampedPillLeft = Math.max(pillMinX, Math.min(idealPillLeft, pillMaxX));
    pill.style.left = `${Math.round(clampedPillLeft - boxRect.left)}px`;
  }
}

function updateCropBadgeAndInputs() {
  if (!state.cropCoordsPt) return;
  const [x0, y0, x1, y1] = state.cropCoordsPt;
  const pW = state.pageWidthPt || 595;
  const pH = state.pageHeightPt || 842;

  const leftPt = Math.round(x0);
  const topPt = Math.round(y0);
  const rightPt = Math.round(Math.max(0, pW - x1));
  const bottomPt = Math.round(Math.max(0, pH - y1));

  const wPt = Math.round(x1 - x0);
  const hPt = Math.round(y1 - y0);
  const wMm = Math.round(wPt * 0.352778);
  const hMm = Math.round(hPt * 0.352778);

  if (activeCropBox) {
    const badge = activeCropBox.querySelector(".crop-badge");
    if (badge) {
      badge.textContent = `${wPt} × ${hPt} pt (${wMm} × ${hMm} mm)`;
    }
  }

  const inLeft = document.getElementById("cropMarginLeft");
  const inTop = document.getElementById("cropMarginTop");
  const inRight = document.getElementById("cropMarginRight");
  const inBottom = document.getElementById("cropMarginBottom");
  if (inLeft) inLeft.value = leftPt;
  if (inTop) inTop.value = topPt;
  if (inRight) inRight.value = rightPt;
  if (inBottom) inBottom.value = bottomPt;
}

function syncCropBoxToScreen() {
  if (!activeCropBox || !state.cropCoordsPt) return;
  const rect = pageToScreenRect(state.cropCoordsPt);
  activeCropBox.style.left = `${Math.round(rect.left)}px`;
  activeCropBox.style.top = `${Math.round(rect.top)}px`;
  activeCropBox.style.width = `${Math.round(rect.width)}px`;
  activeCropBox.style.height = `${Math.round(rect.height)}px`;
  updateCropBadgeAndInputs();
  updateCropToolbarPosition();
}

function applyAspectRatioToCurrentBox(ratioVal) {
  state.cropRatio = ratioVal;
  const floatingSelect = activeCropBox ? activeCropBox.querySelector("#cropFloatingRatioSelect") : null;
  const sidebarSelect = document.getElementById("sidebarCropRatioSelect");
  if (floatingSelect && floatingSelect.value !== ratioVal) floatingSelect.value = ratioVal;
  if (sidebarSelect && sidebarSelect.value !== ratioVal) sidebarSelect.value = ratioVal;

  if (ratioVal === "free") {
    if (activeCropBox) {
      activeCropBox._isRatioLocked = false;
      activeCropBox._getAspectRatio = null;
    }
    return;
  }

  let targetRatio = 1.0;
  if (ratioVal === "page") targetRatio = (state.pageWidthPt || 595) / (state.pageHeightPt || 842);
  else if (ratioVal === "a4") targetRatio = 210 / 297;
  else if (ratioVal === "letter") targetRatio = 8.5 / 11;
  else if (ratioVal === "1:1") targetRatio = 1.0;
  else if (ratioVal === "16:9") targetRatio = 16 / 9;
  else if (ratioVal === "4:3") targetRatio = 4 / 3;

  if (!activeCropBox || !state.cropCoordsPt) return;

  activeCropBox._isRatioLocked = true;
  activeCropBox._getAspectRatio = () => targetRatio;

  // Fit current box to selected ratio
  let [x0, y0, x1, y1] = state.cropCoordsPt;
  let curW = Math.max(20, x1 - x0);
  let curH = Math.max(20, y1 - y0);
  let centerX = (x0 + x1) / 2;
  let centerY = (y0 + y1) / 2;

  let newW = curW;
  let newH = curW / targetRatio;
  const maxW = state.pageWidthPt || 595;
  const maxH = state.pageHeightPt || 842;

  if (newH > maxH) {
    newH = maxH;
    newW = newH * targetRatio;
  }
  if (newW > maxW) {
    newW = maxW;
    newH = newW / targetRatio;
  }

  let newX0 = Math.max(0, centerX - newW / 2);
  let newY0 = Math.max(0, centerY - newH / 2);
  let newX1 = Math.min(maxW, newX0 + newW);
  let newY1 = Math.min(maxH, newY0 + newH);
  if (newX1 - newX0 < newW) newX0 = Math.max(0, newX1 - newW);
  if (newY1 - newY0 < newH) newY0 = Math.max(0, newY1 - newH);

  state.cropCoordsPt = [newX0, newY0, newX1, newY1];
  syncCropBoxToScreen();
}

async function autoFitCropContent() {
  if (!state.docId) return;
  setLoading(true, "Detecting page content boundaries...");
  try {
    const res = await fetch(`/api/document/${state.docId}/page/${state.currentPage}/content-bounds?padding=18`);
    if (!res.ok) throw new Error("Failed to detect content bounds");
    const data = await res.json();
    if (data.bbox) {
      state.cropCoordsPt = [data.bbox[0], data.bbox[1], data.bbox[2], data.bbox[3]];
      syncCropBoxToScreen();
      showToast(data.has_content ? "Auto-fitted to page content boundaries." : "No text/graphics detected; framed with default margin.", "info");
    }
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

async function applyVisualCrop(applyAll = false) {
  if (!state.docId || !state.cropCoordsPt) return;
  const [x0, y0, x1, y1] = state.cropCoordsPt;
  const rect = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
  if ((rect[2] - rect[0]) < 10 || (rect[3] - rect[1]) < 10) {
    return showToast("Crop box must be at least 10x10 pt.", "warning");
  }

  setLoading(true, applyAll ? "Cropping all pages..." : "Cropping page...");
  try {
    const res = await fetch(`/api/document/${state.docId}/page/crop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        page: state.currentPage,
        crop_box: rect,
        apply_all_pages: applyAll
      })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to crop page");
    }
    const data = await res.json();
    cancelVisualCrop();
    updateUndoRedoButtons(true, false);
    showToast(data.message || (applyAll ? "All pages cropped successfully!" : `Page ${state.currentPage} cropped!`), "success");
    await loadPage(state.currentPage);
  } catch (err) {
    showToast(err.message, "error");
  } finally {
    setLoading(false);
  }
}

function renderVisualCropBox() {
  if (!interactiveOverlay) return;
  if (activeCropBox) {
    activeCropBox.remove();
    activeCropBox = null;
  }

  const pW = state.pageWidthPt || 595;
  const pH = state.pageHeightPt || 842;

  if (!state.cropCoordsPt) {
    const leftVal = parseFloat(document.getElementById("cropMarginLeft")?.value || 0);
    const topVal = parseFloat(document.getElementById("cropMarginTop")?.value || 0);
    const rightVal = parseFloat(document.getElementById("cropMarginRight")?.value || 0);
    const bottomVal = parseFloat(document.getElementById("cropMarginBottom")?.value || 0);
    if ((leftVal > 0 || topVal > 0 || rightVal > 0 || bottomVal > 0) &&
        (pW - rightVal > leftVal + 20) && (pH - bottomVal > topVal + 20)) {
      state.cropCoordsPt = [leftVal, topVal, pW - rightVal, pH - bottomVal];
    } else {
      state.cropCoordsPt = [
        Math.round(pW * 0.05),
        Math.round(pH * 0.05),
        Math.round(pW * 0.95),
        Math.round(pH * 0.95)
      ];
    }
  }

  const screenRect = pageToScreenRect(state.cropCoordsPt);
  const box = document.createElement("div");
  box.id = "activeVisualCropBox";
  box.className = "visual-crop-box";
  box.style.left = `${Math.round(screenRect.left)}px`;
  box.style.top = `${Math.round(screenRect.top)}px`;
  box.style.width = `${Math.round(screenRect.width)}px`;
  box.style.height = `${Math.round(screenRect.height)}px`;

  // 1. Rule-of-thirds grid
  const grid = document.createElement("div");
  grid.className = "crop-grid-overlay";
  for (let i = 0; i < 9; i++) {
    grid.appendChild(document.createElement("div"));
  }
  box.appendChild(grid);

  // 2. Drag Pill with Page info and live coordinates badge
  const pill = document.createElement("div");
  pill.className = "crop-top-pill";
  pill.innerHTML = `
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2v14a2 2 0 0 0 2 2h14"></path><path d="M18 22V8a2 2 0 0 0-2-2H2"></path></svg>
    <span>Crop Page ${state.currentPage}</span>
    <span class="crop-badge"></span>
    <span class="crop-close-btn" title="Cancel Crop (Esc)">&times;</span>
  `;
  box.appendChild(pill);
  pill.querySelector(".crop-close-btn").addEventListener("click", () => cancelVisualCrop());

  // 3. Floating Micro-Toolbar
  const allPagesChecked = document.getElementById("cropAllPages")?.checked || false;
  const toolbar = document.createElement("div");
  toolbar.className = "crop-floating-toolbar";
  toolbar.innerHTML = `
    <select id="cropFloatingRatioSelect" title="Aspect Ratio Preset">
      <option value="free" ${state.cropRatio === "free" ? "selected" : ""}>Free</option>
      <option value="page" ${state.cropRatio === "page" ? "selected" : ""}>Page Ratio</option>
      <option value="a4" ${state.cropRatio === "a4" ? "selected" : ""}>A4</option>
      <option value="letter" ${state.cropRatio === "letter" ? "selected" : ""}>Letter</option>
      <option value="1:1" ${state.cropRatio === "1:1" ? "selected" : ""}>1:1</option>
      <option value="16:9" ${state.cropRatio === "16:9" ? "selected" : ""}>16:9</option>
      <option value="4:3" ${state.cropRatio === "4:3" ? "selected" : ""}>4:3</option>
    </select>
    <button type="button" id="cropBtnAutoFit" class="btn btn-xs btn-outline" title="Auto-fit crop box to detected content boundaries">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span>Auto-Fit</span>
    </button>
    <button type="button" id="cropBtnFullPage" class="btn btn-xs btn-outline" title="Reset crop box to full page">
      <span>Full Page</span>
    </button>
    <label style="display:inline-flex;align-items:center;gap:4px;font-size:11px;cursor:pointer;margin:0 4px;" title="Apply this crop to all document pages">
      <input type="checkbox" id="cropFloatingAllPages" ${allPagesChecked ? "checked" : ""}> All Pages
    </label>
    <button type="button" id="cropBtnApply" class="btn btn-xs btn-primary" title="Apply crop to page">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
      <span>Apply</span>
    </button>
    <button type="button" id="cropBtnCancel" class="btn btn-xs btn-secondary" title="Cancel Crop">
      <span>Cancel</span>
    </button>
  `;
  toolbar.addEventListener("mousedown", (e) => e.stopPropagation());
  box.appendChild(toolbar);

  // Wire toolbar controls
  toolbar.querySelector("#cropFloatingRatioSelect").addEventListener("change", (e) => {
    applyAspectRatioToCurrentBox(e.target.value);
  });
  toolbar.querySelector("#cropBtnAutoFit").addEventListener("click", () => {
    autoFitCropContent();
  });
  toolbar.querySelector("#cropBtnFullPage").addEventListener("click", () => {
    state.cropCoordsPt = [0, 0, state.pageWidthPt || 595, state.pageHeightPt || 842];
    syncCropBoxToScreen();
  });
  const floatingAllCheck = toolbar.querySelector("#cropFloatingAllPages");
  floatingAllCheck.addEventListener("change", (e) => {
    const mainCheck = document.getElementById("cropAllPages");
    if (mainCheck) mainCheck.checked = e.target.checked;
  });
  toolbar.querySelector("#cropBtnApply").addEventListener("click", () => {
    applyVisualCrop(floatingAllCheck.checked);
  });
  toolbar.querySelector("#cropBtnCancel").addEventListener("click", () => {
    cancelVisualCrop();
  });

  // Attach dragging on pill and box
  function onCropMoved(newLeft, newTop, wPx, hPx) {
    const { scaleX, scaleY } = getOverlayScale();
    const ptX0 = Math.max(0, newLeft / scaleX);
    const ptY0 = Math.max(0, newTop / scaleY);
    const ptX1 = Math.min(state.pageWidthPt, (newLeft + wPx) / scaleX);
    const ptY1 = Math.min(state.pageHeightPt, (newTop + hPx) / scaleY);
    state.cropCoordsPt = [ptX0, ptY0, ptX1, ptY1];
    updateCropBadgeAndInputs();
    updateCropToolbarPosition();
  }

  function onCropResized(lastL, lastT, lastW, lastH) {
    const { scaleX, scaleY } = getOverlayScale();
    const ptX0 = Math.max(0, lastL / scaleX);
    const ptY0 = Math.max(0, lastT / scaleY);
    const ptX1 = Math.min(state.pageWidthPt, (lastL + lastW) / scaleX);
    const ptY1 = Math.min(state.pageHeightPt, (lastT + lastH) / scaleY);
    state.cropCoordsPt = [ptX0, ptY0, ptX1, ptY1];
    updateCropBadgeAndInputs();
    updateCropToolbarPosition();
  }

  makeDraggable(box, pill, onCropMoved, onCropMoved);
  makeDraggable(box, box, onCropMoved, onCropMoved);
  makeResizable(box, onCropResized, onCropResized);

  interactiveOverlay.appendChild(box);
  activeCropBox = box;

  // Apply current aspect ratio setting if locked
  if (state.cropRatio && state.cropRatio !== "free") {
    applyAspectRatioToCurrentBox(state.cropRatio);
  } else {
    updateCropBadgeAndInputs();
    updateCropToolbarPosition();
  }

  // Viewport scroll & resize listeners to keep toolbar clamped
  const canvasViewportEl = document.getElementById("canvasViewport");
  const onViewportScrollOrResize = () => updateCropToolbarPosition();
  if (canvasViewportEl) canvasViewportEl.addEventListener("scroll", onViewportScrollOrResize, { passive: true });
  window.addEventListener("resize", onViewportScrollOrResize, { passive: true });
}

function startVisualCrop() {
  if (!state.docId) return showToast("No document loaded", "error");

  if (state.isVisualCropping) {
    cancelVisualCrop();
    return;
  }

  if (activeTransformBox) cancelTransformBox(false);
  deselectFormField();

  state.isVisualCropping = true;

  const btn = document.getElementById("btnStartVisualCrop");
  if (btn) btn.classList.add("active");

  const card = document.getElementById("visualCropActiveCard");
  if (card) card.style.display = "block";

  renderVisualCropBox();
  showToast("Visual crop tool active: Drag handles to frame crop area.", "info");
}

function setupPageCroppingAndTrimming() {
  const btnAutoTrimMargins = document.getElementById("btnAutoTrimMargins");
  const btnApplyManualCrop = document.getElementById("btnApplyManualCrop");
  const btnStartVisualCrop = document.getElementById("btnStartVisualCrop");
  const btnCancelVisualCropSidebar = document.getElementById("btnCancelVisualCropSidebar");
  const sidebarCropRatioSelect = document.getElementById("sidebarCropRatioSelect");
  const btnSidebarAutoFitCrop = document.getElementById("btnSidebarAutoFitCrop");
  const btnSidebarResetCrop = document.getElementById("btnSidebarResetCrop");
  const btnSidebarApplyCrop = document.getElementById("btnSidebarApplyCrop");

  if (btnAutoTrimMargins) {
    btnAutoTrimMargins.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      setLoading(true, "Detecting content boundaries & trimming margins...");
      try {
        const res = await fetch(`/api/document/${state.docId}/trim-margins`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ page: state.currentPage, padding: 18.0 })
        });
        if (!res.ok) throw new Error("Failed to trim margins");
        const data = await res.json();
        updateUndoRedoButtons(true, false);
        showToast(data.message || "Margins auto-trimmed!", "success");
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  if (btnApplyManualCrop) {
    btnApplyManualCrop.addEventListener("click", async () => {
      if (!state.docId) return showToast("No document loaded", "error");
      const left = parseFloat(document.getElementById("cropMarginLeft")?.value || 0);
      const top = parseFloat(document.getElementById("cropMarginTop")?.value || 0);
      const right = parseFloat(document.getElementById("cropMarginRight")?.value || 0);
      const bottom = parseFloat(document.getElementById("cropMarginBottom")?.value || 0);
      const applyAll = document.getElementById("cropAllPages")?.checked || false;

      const pW = state.pageWidthPt || 595;
      const pH = state.pageHeightPt || 842;
      const cropBox = [left, top, Math.max(left + 20, pW - right), Math.max(top + 20, pH - bottom)];

      setLoading(true, "Applying page crop...");
      try {
        const res = await fetch(`/api/document/${state.docId}/page/crop`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            page: state.currentPage,
            crop_box: cropBox,
            apply_all_pages: applyAll
          })
        });
        if (!res.ok) throw new Error("Failed to crop page");
        const data = await res.json();
        if (state.isVisualCropping) cancelVisualCrop();
        updateUndoRedoButtons(true, false);
        showToast(data.message || "Page cropped!", "success");
        await loadPage(state.currentPage);
      } catch (err) {
        showToast(err.message, "error");
      } finally {
        setLoading(false);
      }
    });
  }

  if (btnStartVisualCrop) {
    btnStartVisualCrop.addEventListener("click", () => {
      startVisualCrop();
    });
  }

  if (btnCancelVisualCropSidebar) {
    btnCancelVisualCropSidebar.addEventListener("click", () => {
      cancelVisualCrop();
    });
  }

  if (sidebarCropRatioSelect) {
    sidebarCropRatioSelect.addEventListener("change", (e) => {
      applyAspectRatioToCurrentBox(e.target.value);
    });
  }

  if (btnSidebarAutoFitCrop) {
    btnSidebarAutoFitCrop.addEventListener("click", () => {
      autoFitCropContent();
    });
  }

  if (btnSidebarResetCrop) {
    btnSidebarResetCrop.addEventListener("click", () => {
      state.cropCoordsPt = [0, 0, state.pageWidthPt || 595, state.pageHeightPt || 842];
      syncCropBoxToScreen();
    });
  }

  if (btnSidebarApplyCrop) {
    btnSidebarApplyCrop.addEventListener("click", () => {
      const applyAll = document.getElementById("cropAllPages")?.checked || false;
      applyVisualCrop(applyAll);
    });
  }

  // Live input sync from sidebar margin fields
  ["cropMarginLeft", "cropMarginTop", "cropMarginRight", "cropMarginBottom"].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener("input", () => {
      if (!state.isVisualCropping || !activeCropBox) return;
      const pW = state.pageWidthPt || 595;
      const pH = state.pageHeightPt || 842;
      const l = parseFloat(document.getElementById("cropMarginLeft")?.value || 0) || 0;
      const t = parseFloat(document.getElementById("cropMarginTop")?.value || 0) || 0;
      const r = parseFloat(document.getElementById("cropMarginRight")?.value || 0) || 0;
      const b = parseFloat(document.getElementById("cropMarginBottom")?.value || 0) || 0;

      const x0 = Math.max(0, Math.min(l, pW - 20));
      const y0 = Math.max(0, Math.min(t, pH - 20));
      const x1 = Math.min(pW, Math.max(x0 + 20, pW - r));
      const y1 = Math.min(pH, Math.max(y0 + 20, pH - b));

      state.cropCoordsPt = [x0, y0, x1, y1];
      syncCropBoxToScreen();
    });
  });

  const mainCheck = document.getElementById("cropAllPages");
  if (mainCheck) {
    mainCheck.addEventListener("change", (e) => {
      const floatingCheck = activeCropBox ? activeCropBox.querySelector("#cropFloatingAllPages") : null;
      if (floatingCheck) floatingCheck.checked = e.target.checked;
    });
  }
}

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ==========================================================================
// Professional PDF Compression Feature Controller
// ==========================================================================

function setupPdfCompressionFeature() {
  const btnModeLossy = document.getElementById("btnModeLossy");
  const btnModeLossless = document.getElementById("btnModeLossless");
  const lossyOptionsContainer = document.getElementById("lossyOptionsContainer");
  const losslessInfoBox = document.getElementById("losslessInfoBox");
  const presetCards = document.querySelectorAll("#tab-compress .preset-card");
  const customSettingsPanel = document.getElementById("customCompressionSettings");

  const qualitySlider = document.getElementById("compressImageQuality");
  const qualityValSpan = document.getElementById("compressQualityValue");
  const dpiSelect = document.getElementById("compressMaxDpi");
  const grayscaleCheckbox = document.getElementById("compressGrayscale");
  const removeMetadataCheckbox = document.getElementById("compressRemoveMetadata");

  const dropZone = document.getElementById("compressDropZone");
  const fileInput = document.getElementById("compressFileInput");
  const browseLink = document.getElementById("compressBrowseLink");
  const selectedFileName = document.getElementById("compressSelectedFileName");
  const btnExecute = document.getElementById("btnExecuteCompress");
  const buttonLabel = document.getElementById("compressButtonLabel");

  const progressContainer = document.getElementById("compressProgressContainer");
  const progressStatus = document.getElementById("compressProgressStatus");
  const progressPct = document.getElementById("compressProgressPct");
  const progressBar = document.getElementById("compressProgressBar");

  const resultsCard = document.getElementById("compressResultsCard");
  const savingsBadge = document.getElementById("compressSavingsBadge");
  const metricOrig = document.getElementById("metricOriginalSize");
  const metricComp = document.getElementById("metricCompressedSize");
  const metricSaved = document.getElementById("metricBytesSaved");
  const metricImages = document.getElementById("metricImagesOptimized");
  const btnDownloadResult = document.getElementById("btnDownloadCompressedPdf");
  const btnOpenInEditor = document.getElementById("btnOpenInEditor");

  const errorBanner = document.getElementById("compressErrorBanner");
  const errorMessage = document.getElementById("compressErrorMessage");

  let compressState = {
    mode: "lossy",
    preset: "recommended",
    quality: 75,
    maxDpi: 150,
    grayscale: false,
    removeMetadata: false,
    uploadedFile: null,
    lastResult: null
  };

  function formatBytes(bytes, decimals = 1) {
    if (!bytes || bytes <= 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  function hideError() {
    if (errorBanner) errorBanner.style.display = "none";
  }

  function showError(msg) {
    if (errorBanner && errorMessage) {
      errorMessage.textContent = msg;
      errorBanner.style.display = "flex";
    }
    showToast(msg, "error");
  }

  // Mode Switching
  if (btnModeLossy && btnModeLossless) {
    btnModeLossy.addEventListener("click", () => {
      compressState.mode = "lossy";
      btnModeLossy.classList.add("active");
      btnModeLossless.classList.remove("active");
      if (lossyOptionsContainer) lossyOptionsContainer.style.display = "block";
      if (losslessInfoBox) losslessInfoBox.style.display = "none";
    });

    btnModeLossless.addEventListener("click", () => {
      compressState.mode = "lossless";
      btnModeLossless.classList.add("active");
      btnModeLossy.classList.remove("active");
      if (lossyOptionsContainer) lossyOptionsContainer.style.display = "none";
      if (losslessInfoBox) losslessInfoBox.style.display = "flex";
    });
  }

  // Preset Selection
  presetCards.forEach(card => {
    card.addEventListener("click", () => {
      presetCards.forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      const preset = card.getAttribute("data-preset");
      compressState.preset = preset;

      if (preset === "custom") {
        if (customSettingsPanel) customSettingsPanel.style.display = "flex";
      } else {
        if (customSettingsPanel) customSettingsPanel.style.display = "none";
        if (preset === "extreme") {
          compressState.quality = 40;
          compressState.maxDpi = 96;
        } else if (preset === "recommended") {
          compressState.quality = 70;
          compressState.maxDpi = 150;
        } else if (preset === "high") {
          compressState.quality = 85;
          compressState.maxDpi = 220;
        }
      }
    });
  });

  // Slider and Select bindings
  if (qualitySlider && qualityValSpan) {
    qualitySlider.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      compressState.quality = val;
      qualityValSpan.textContent = `${val}%`;
    });
  }

  if (dpiSelect) {
    dpiSelect.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      compressState.maxDpi = val;
    });
  }

  if (grayscaleCheckbox) {
    grayscaleCheckbox.addEventListener("change", (e) => {
      compressState.grayscale = e.target.checked;
    });
  }

  if (removeMetadataCheckbox) {
    removeMetadataCheckbox.addEventListener("change", (e) => {
      compressState.removeMetadata = e.target.checked;
    });
  }

  // File dropzone
  if (browseLink && fileInput) {
    browseLink.addEventListener("click", (e) => {
      e.stopPropagation();
      fileInput.click();
    });
  }

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("dragover");
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    fileInput.addEventListener("change", (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });
  }

  function handleFileSelect(file) {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      showToast("Please select a PDF file.", "error");
      return;
    }
    compressState.uploadedFile = file;
    if (selectedFileName) {
      selectedFileName.textContent = `Selected: ${file.name} (${formatBytes(file.size)})`;
    }
    if (buttonLabel) {
      buttonLabel.textContent = "Compress Uploaded PDF";
    }
    hideError();
  }

  // Execution
  if (btnExecute) {
    btnExecute.addEventListener("click", async () => {
      hideError();
      if (!compressState.uploadedFile && !state.docId) {
        showError("Please upload a PDF file or open a document in the editor first.");
        return;
      }

      if (progressContainer) progressContainer.style.display = "block";
      if (resultsCard) resultsCard.style.display = "none";
      if (progressBar) progressBar.style.width = "20%";
      if (progressPct) progressPct.textContent = "20%";
      if (progressStatus) progressStatus.textContent = "Analyzing document streams...";

      const progressTimer1 = setTimeout(() => {
        if (progressBar) progressBar.style.width = "50%";
        if (progressPct) progressPct.textContent = "50%";
        if (progressStatus) progressStatus.textContent = compressState.mode === "lossy" ? "Optimizing & downsampling images..." : "Deflating stream tables...";
      }, 400);

      const progressTimer2 = setTimeout(() => {
        if (progressBar) progressBar.style.width = "85%";
        if (progressPct) progressPct.textContent = "85%";
        if (progressStatus) progressStatus.textContent = "Purging dead xrefs & writing optimized PDF...";
      }, 900);

      try {
        let res, data;
        if (compressState.uploadedFile) {
          const formData = new FormData();
          formData.append("file", compressState.uploadedFile);
          formData.append("mode", compressState.mode);
          formData.append("preset", compressState.preset);
          formData.append("image_quality", compressState.quality);
          formData.append("max_dpi", compressState.maxDpi);
          formData.append("grayscale", compressState.grayscale);
          formData.append("remove_metadata", compressState.removeMetadata);

          res = await fetch("/api/compress-file", {
            method: "POST",
            body: formData
          });
          data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Compression failed");
        } else {
          res = await fetch(`/api/document/${state.docId}/compress`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: compressState.mode,
              preset: compressState.preset,
              image_quality: compressState.quality,
              max_dpi: compressState.maxDpi,
              grayscale: compressState.grayscale,
              remove_metadata: compressState.removeMetadata
            })
          });
          data = await res.json();
          if (!res.ok) throw new Error(data.detail || "Compression failed");
          updateUndoRedoButtons(true, false);
          await loadPage(state.currentPage);
        }

        clearTimeout(progressTimer1);
        clearTimeout(progressTimer2);

        if (progressBar) progressBar.style.width = "100%";
        if (progressPct) progressPct.textContent = "100%";
        if (progressStatus) progressStatus.textContent = "Compression complete!";

        compressState.lastResult = data;

        // Display results
        setTimeout(() => {
          if (progressContainer) progressContainer.style.display = "none";
          if (resultsCard) resultsCard.style.display = "block";

          const savings = data.savings_percent || 0;
          if (savingsBadge) {
            savingsBadge.textContent = `-${savings}%`;
          }
          if (metricOrig) metricOrig.textContent = formatBytes(data.original_size);
          if (metricComp) metricComp.textContent = formatBytes(data.compressed_size || data.new_size);
          if (metricSaved) metricSaved.textContent = formatBytes(data.bytes_saved || Math.max(0, data.original_size - (data.compressed_size || data.new_size)));
          if (metricImages) metricImages.textContent = data.images_optimized !== undefined ? data.images_optimized : "0";

          if (btnOpenInEditor) {
            if (compressState.uploadedFile && data.doc_id) {
              btnOpenInEditor.style.display = "block";
              btnOpenInEditor.onclick = async () => {
                state.docId = data.doc_id;
                state.filename = data.filename || "compressed.pdf";
                state.currentPage = 1;
                state.totalPages = data.page_count || 1;
                totalPagesSpan.textContent = state.totalPages;
                pageNumberInput.max = state.totalPages;
                pageNumberInput.value = 1;
                activeFilename.textContent = state.filename;
                uploadSection.style.display = "none";
                workspaceSection.style.display = "flex";
                topNavActions.style.display = "flex";
                await loadPage(1);
                await renderThumbnails();
                showToast("Compressed document opened in editor workspace!", "success");
              };
            } else {
              btnOpenInEditor.style.display = "none";
            }
          }

          showToast("PDF compressed successfully!", "success");
        }, 300);

      } catch (err) {
        clearTimeout(progressTimer1);
        clearTimeout(progressTimer2);
        if (progressContainer) progressContainer.style.display = "none";
        showError(err.message || "An error occurred during compression.");
      }
    });
  }

  // Download Button Handler
  if (btnDownloadResult) {
    btnDownloadResult.addEventListener("click", () => {
      const res = compressState.lastResult;
      if (!res) return showToast("No compressed document available to download.", "error");

      const targetDocId = res.doc_id || state.docId;
      if (!targetDocId) return showToast("Document ID not found.", "error");

      const downloadUrl = `/api/document/${targetDocId}/download`;
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = res.filename ? `compressed_${res.filename}` : "compressed_document.pdf";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Download started!", "success");
    });
  }
}

// Global Security & Password Helpers (Feature 29: Unlock PDF)
window.openPasswordPromptModal = function(filename) {
  const modal = document.getElementById("passwordPromptModal");
  if (!modal) return;
  const fnEl = document.getElementById("promptModalFilename");
  if (fnEl) fnEl.textContent = filename || state.filename || "Enter password to decrypt";
  const pwInput = document.getElementById("promptModalPassword");
  if (pwInput) pwInput.value = "";
  const errEl = document.getElementById("passwordPromptError");
  if (errEl) errEl.style.display = "none";
  openModal("passwordPromptModal");
  setTimeout(() => { if (pwInput) pwInput.focus(); }, 120);
};

window.closePasswordPromptModal = function() {
  closeModal("passwordPromptModal");
  if (!state.docInfo || state.docInfo.page_count === 0) {
    if (state.docId) {
      fetch(`/api/document/${state.docId}/close`, { method: "POST" }).catch(() => {});
      state.docId = null;
    }
    uploadSection.style.display = "block";
    workspaceSection.style.display = "none";
    topNavActions.style.display = "none";
  }
};

window.togglePasswordVisibility = function(inputId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.type = el.type === "password" ? "text" : "password";
};

async function promptUnlockAndDownload() {
  const pwInput = document.getElementById("promptModalPassword");
  const errEl = document.getElementById("passwordPromptError");
  const password = pwInput ? pwInput.value : "";
  if (!password) {
    if (errEl) {
      errEl.textContent = "Please enter the document password.";
      errEl.style.display = "block";
    }
    return;
  }

  setLoading(true, "Decrypting and downloading PDF...");
  try {
    const res = await fetch(`/api/document/${state.docId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.detail || "Incorrect password.");
    }

    closeModal("passwordPromptModal");
    const downloadRes = await fetch(`/api/document/${state.docId}/download`);
    if (!downloadRes.ok) throw new Error("Failed to download decrypted file.");
    const blob = await downloadRes.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const origBase = (state.filename || "document").replace(/\.[^/.]+$/, "");
    a.href = url;
    a.download = `${origBase}_unlocked.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("PDF unlocked and downloaded successfully!", "success");
    if (!state.docInfo || state.docInfo.page_count === 0) {
      uploadSection.style.display = "block";
      workspaceSection.style.display = "none";
      topNavActions.style.display = "none";
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || "Incorrect password. Please try again.";
      errEl.style.display = "block";
    }
    if (pwInput) pwInput.select();
  } finally {
    setLoading(false);
  }
}

async function submitPasswordPrompt() {
  const pwInput = document.getElementById("promptModalPassword");
  const errEl = document.getElementById("passwordPromptError");
  const password = pwInput ? pwInput.value : "";
  if (!password) {
    if (errEl) {
      errEl.textContent = "Please enter the document password.";
      errEl.style.display = "block";
    }
    return;
  }

  setLoading(true, "Unlocking document...");
  try {
    const res = await fetch(`/api/document/${state.docId}/unlock`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const result = await res.json();
    if (!res.ok) {
      throw new Error(result.detail || "Incorrect password.");
    }

    closePasswordPromptModal();
    state.docInfo = result.info;
    state.totalPages = result.info.page_count;
    state.currentPage = 1;

    activeFilename.textContent = state.filename;
    totalPagesSpan.textContent = state.totalPages;
    pageNumberInput.value = 1;
    pageNumberInput.max = state.totalPages;

    const firstPage = state.docInfo && state.docInfo.pages && state.docInfo.pages[0];
    if (firstPage) {
      state.pageWidthPt = firstPage.width;
      state.pageHeightPt = firstPage.height;
    }

    uploadSection.style.display = "none";
    workspaceSection.style.display = "flex";
    topNavActions.style.display = "flex";

    state.zoom = calculateOptimalZoom("fit-page");
    updateZoomSelectLabel();
    updateUndoRedoButtons(false, false);
    updatePageOrderInput();
    populateThumbnails();
    await loadPage(1);
    updateSecurityTabUI();
    showToast("PDF unlocked and decrypted successfully!", "success");

    if (state.pendingTargetTab) {
      const pendingTab = state.pendingTargetTab;
      const pendingSub = state.pendingSubAction;
      state.pendingTargetTab = null;
      state.pendingSubAction = null;
      setTimeout(() => {
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${pendingTab}"]`);
        if (tabBtn) tabBtn.click();
        if (pendingTab === "tab-shapes") {
          if (pendingSub === "ruler") {
            if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("ruler");
          } else {
            if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("shapes");
          }
        }
      }, 150);
    }
  } catch (err) {
    if (errEl) {
      errEl.textContent = err.message || "Incorrect password. Please try again.";
      errEl.style.display = "block";
    }
  } finally {
    setLoading(false);
  }
}

async function updateSecurityTabUI() {
  const badge = document.getElementById("docSecurityBadge");
  const desc = document.getElementById("docSecurityDesc");
  const unlockCard = document.getElementById("unlockSectionCard");
  const protectCard = document.getElementById("protectSectionCard");

  if (!badge) return;

  let isEncrypted = state.docInfo ? Boolean(state.docInfo.is_encrypted) : false;

  if (state.docId && state.docInfo && (state.docInfo.is_encrypted === undefined || state.docInfo.is_encrypted === false)) {
    try {
      const res = await fetch(`/api/document/${state.docId}/security-inspect`);
      if (res.ok) {
        const audit = await res.json();
        isEncrypted = Boolean(audit.is_encrypted);
        if (state.docInfo) state.docInfo.is_encrypted = isEncrypted;
      }
    } catch (_) {}
  }

  if (isEncrypted) {
    badge.className = "audit-pill audit-pill-warn";
    badge.textContent = "Encrypted (AES-256)";
    if (desc) desc.textContent = "This document is password-protected. Print, copy, or editing restrictions may be enforced.";
    if (unlockCard) unlockCard.style.display = "block";
  } else {
    badge.className = "audit-pill audit-pill-ok";
    badge.textContent = "Unprotected (No Password)";
    if (desc) desc.textContent = "This document has no password protection. You can encrypt it with AES-256 below.";
    if (unlockCard) unlockCard.style.display = "none";
  }
  if (protectCard) protectCard.style.display = "block";
}

// Zero-Retention Security: Scrub session from server RAM/disk when user navigates away
window.addEventListener("beforeunload", () => {
  if (state.docId) {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`/api/document/${state.docId}/close`);
    } else {
      fetch(`/api/document/${state.docId}/close`, { method: "POST", keepalive: true }).catch(() => {});
    }
  }
});

// ==========================================================================
// B9. Landing / Tool Selection Page Directory Logic
// ==========================================================================

window.launchLandingTool = function(targetTab, subAction) {
  if (state.docId) {
    // If a document is currently loaded, switch to workspace and activate the tool tab directly
    window.returnToWorkspace();
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${targetTab}"]`);
    if (tabBtn) tabBtn.click();
    if (targetTab === "tab-shapes") {
      if (subAction === "ruler") {
        if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("ruler");
      } else {
        if (typeof window.setShapesSubMode === "function") window.setShapesSubMode("shapes");
      }
    }
  } else {
    // If no document is open, store target tab and prompt file picker
    state.pendingTargetTab = targetTab;
    state.pendingSubAction = subAction;
    showToast("Please choose a PDF file to begin using this tool.", "info");
    const fileInput = document.getElementById("pdfFileInput");
    if (fileInput) fileInput.click();
  }
};

window.showLandingPage = function() {
  if (state.docId) {
    if (activeDocReturnBanner) activeDocReturnBanner.style.display = "flex";
    if (activeDocBannerName) activeDocBannerName.textContent = state.filename || "document.pdf";
  } else {
    if (activeDocReturnBanner) activeDocReturnBanner.style.display = "none";
  }
  uploadSection.style.display = "block";
  workspaceSection.style.display = "none";
  if (state.docId) {
    topNavActions.style.display = "flex";
  }
  const dirEl = document.getElementById("toolDirectorySection");
  if (dirEl) {
    dirEl.scrollIntoView({ behavior: "smooth" });
  }
};

window.returnToWorkspace = function() {
  if (state.docId) {
    uploadSection.style.display = "none";
    workspaceSection.style.display = "flex";
    topNavActions.style.display = "flex";
    if (activeDocReturnBanner) activeDocReturnBanner.style.display = "none";
  } else {
    uploadSection.style.display = "block";
    workspaceSection.style.display = "none";
    topNavActions.style.display = "none";
  }
};

window.resetToolFilters = function() {
  if (toolSearchInput) toolSearchInput.value = "";
  if (btnClearToolSearch) btnClearToolSearch.style.display = "none";
  
  const catBtns = document.querySelectorAll(".tool-cat-btn");
  catBtns.forEach(btn => {
    if (btn.dataset.category === "all") {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
  filterToolsDirectory();
};

function filterToolsDirectory() {
  const query = toolSearchInput ? toolSearchInput.value.trim().toLowerCase() : "";
  const activeCatBtn = document.querySelector(".tool-cat-btn.active");
  const activeCategory = activeCatBtn ? activeCatBtn.dataset.category : "all";
  
  const cards = document.querySelectorAll(".tool-dir-card");
  let visibleCount = 0;

  cards.forEach(card => {
    const cardCat = card.dataset.category || "";
    const cardKeywords = (card.dataset.keywords || "").toLowerCase();
    const titleEl = card.querySelector("h4");
    const descEl = card.querySelector("p");
    const cardTitle = titleEl ? titleEl.textContent.toLowerCase() : "";
    const cardDesc = descEl ? descEl.textContent.toLowerCase() : "";

    const matchesCategory = activeCategory === "all" || cardCat === activeCategory;
    const matchesQuery = !query || 
      cardTitle.includes(query) || 
      cardDesc.includes(query) || 
      cardKeywords.includes(query) ||
      cardCat.includes(query);

    if (matchesCategory && matchesQuery) {
      card.style.display = "flex";
      visibleCount++;
    } else {
      card.style.display = "none";
    }
  });

  if (toolsCountVisible) {
    toolsCountVisible.textContent = visibleCount;
  }

  if (toolsEmptySearchState) {
    if (visibleCount === 0) {
      toolsEmptySearchState.style.display = "flex";
      if (emptySearchQueryText) {
        emptySearchQueryText.textContent = query 
          ? `We couldn't find any tools matching "${query}" in this category.` 
          : "No tools found in this category.";
      }
    } else {
      toolsEmptySearchState.style.display = "none";
    }
  }
}

function setupLandingToolDirectory() {
  // Navigation actions
  if (btnNavToolsDirectory) {
    btnNavToolsDirectory.addEventListener("click", () => {
      if (workspaceSection.style.display !== "none") {
        window.showLandingPage();
      } else if (state.docId) {
        window.returnToWorkspace();
      } else {
        const dirEl = document.getElementById("toolDirectorySection");
        if (dirEl) dirEl.scrollIntoView({ behavior: "smooth" });
      }
    });
  }

  if (navBrandLogo) {
    navBrandLogo.addEventListener("click", () => {
      if (workspaceSection.style.display !== "none") {
        window.showLandingPage();
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  // Live Search Input
  if (toolSearchInput) {
    toolSearchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (btnClearToolSearch) {
        btnClearToolSearch.style.display = val ? "flex" : "none";
      }
      filterToolsDirectory();
    });
    
    // Quick search shortcut (press "/" when not inside an input)
    document.addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") {
        if (uploadSection.style.display !== "none") {
          e.preventDefault();
          toolSearchInput.focus();
        }
      }
    });
  }

  if (btnClearToolSearch) {
    btnClearToolSearch.addEventListener("click", () => {
      if (toolSearchInput) {
        toolSearchInput.value = "";
        toolSearchInput.focus();
      }
      btnClearToolSearch.style.display = "none";
      filterToolsDirectory();
    });
  }

  // Category Filter Buttons
  const catBtns = document.querySelectorAll(".tool-cat-btn");
  catBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      catBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterToolsDirectory();
    });
  });
}



