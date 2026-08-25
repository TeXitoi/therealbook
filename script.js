class Data {
  constructor() {
    this.curSheetIdx = null;
    this.curBookIdx = null;
    this.title = document.getElementById("title");
    this.alternatives = document.getElementById("alternatives");
    this.welcome = document.getElementById("sheet");

    const sheets = document.getElementById("sheets");
    sheets.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (const [idx, sheet] of data.sheets.entries()) {
      const li = document.createElement("li");
      li.addEventListener("click", () => this.display(idx));
      li.textContent = `${sheet.title} by ${sheet.authors.join(", ")}`;
      li.setAttribute(
        "data-fulltext",
        `${sheet.title} ${sheet.authors.join(" ")}`.toLowerCase(),
      );
      fragment.appendChild(li);
    }
    sheets.appendChild(fragment);
  }
  display(sheetIdx, bookIdx) {
    const sheet = data.sheets[sheetIdx];
    if (!sheet) { return; }
    const books = data.books.filter(b => b.volume === sheet.volume && this.realPage(b, sheet) !== null);
    if (sheetIdx === this.curSheetIdx && bookIdx === undefined) {
      bookIdx = (this.curBookIdx + 1) % books.length;
    } else if (!(bookIdx in books)) {
      bookIdx = 0;
    }
    if (this.curSheetIdx === sheetIdx && this.curBookIdx === bookIdx) { return; }

    this.curSheetIdx = sheetIdx;
    this.curBookIdx = bookIdx;
    const hash = `#${sheetIdx}/${bookIdx}`;
    if (location.hash !== hash) { history.pushState(null, "", hash); }

    const e = document.getElementById("sheet");
    const c = document.createElement("object");
    c.id = "sheet";
    c.setAttribute("type", "application/pdf");
    c.setAttribute(
      "data",
      `${books[bookIdx].url}#page=${this.realPage(books[bookIdx], sheet)}`,
    );
    e.replaceWith(c);

    const title = `${sheet.title} by ${sheet.authors.join(", ")}`;  
    this.title.textContent = title;
    document.title = `${title} — The Real Book`;

    this.alternatives.replaceChildren();
    for (const [idx, book] of books.entries()) {
      const li = document.createElement("li");
      li.textContent = book.name;
      if (idx === this.curBookIdx) {
        li.classList.add("displayed");
      } else {
        li.addEventListener("click", () => this.display(sheetIdx, idx));
      }
      this.alternatives.appendChild(li);
    }
  }
  clear() {
    if (this.curSheetIdx === null) { return; }
    this.curSheetIdx = null;
    this.curBookIdx = null;
    document.getElementById("sheet").replaceWith(this.welcome);
    this.title.textContent = "No sheet selected";
    document.title = "The Real Book";
    this.alternatives.replaceChildren();
  }
  fromHash() {
    const [sheetIdx, bookIdx] = location.hash.slice(1).split("/");
    if (sheetIdx === "") {
      this.clear();
    } else {
      this.display(Number(sheetIdx), Number(bookIdx));
    }
  }
  realPage(book, sheet) {
    for (const offset of book.offsets) {
      if (offset.from !== undefined && sheet.page < offset.from) { continue; }
      if (offset.to !== undefined && offset.to < sheet.page) { continue; }
      return offset.offset + sheet.page;
    }
    return null;
  }
}

class Autocomplete {
  constructor() {
    this.sheets = document.getElementById("sheets");
    this.search = document.getElementById("search");
    this.selected = -1;

    this.search.addEventListener("input", e => { this.clearSelected(); this.filter(e); });
    this.search.addEventListener("keydown", e => this.onKeyDown(e));
  }
  filter(e) {
    const value = e.target.value.toLowerCase();
    for (const sheet of this.sheets.children) {
      if (sheet.getAttribute("data-fulltext").includes(value)) {
        sheet.classList.remove("filtered");
      } else {
        sheet.classList.add("filtered");
      }
    }
  }
  clearSelected() {
    this.selected = -1;
    for (const s of this.sheets.children) {
      s.classList.remove("selected");
    }
  }
  onKeyDown(e) {
    const selectableSheets = this.sheets.querySelectorAll("li:not(.filtered)");
    const select = () => {
      for (const s of this.sheets.children) {
        s.classList.remove("selected");
      }
      selectableSheets[this.selected].classList.add("selected");
      selectableSheets[this.selected].scrollIntoView({ block: "nearest" });
    };
  
    if (selectableSheets.length === 0) {
      return;
    }
    switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      this.selected = (this.selected + 1) % selectableSheets.length;
      select();
      break;
    case "ArrowUp":
      e.preventDefault();
      this.selected = (this.selected + selectableSheets.length - 1) % selectableSheets.length;
      select();
      break;
    case "Enter":
      e.preventDefault();
      if (this.selected > -1) { selectableSheets[this.selected].click(); }
      break;
    case "Escape":
      e.preventDefault();
      this.clearSelected();
      this.search.scrollIntoView({ block: "nearest" });
      break;
    }
  }
}

const app = new Data();
const autocomplete = new Autocomplete();
autocomplete.search.focus();
addEventListener("hashchange", () => app.fromHash());
app.fromHash();
