class Data {
  constructor() {
    this.curSheetId = null;
    this.curBookId = null;
    this.title = document.getElementById("title");
    this.alternatives = document.getElementById("alternatives");

    const sheets = document.getElementById("sheets");
    sheets.innerHTML = "";
    const fragment = document.createDocumentFragment();
    for (const sheet of data.sheets) {
      const li = document.createElement("li");
      li.addEventListener("click", () => this.display(sheet.id));
      li.textContent = `${sheet.title} by ${sheet.authors.join(", ")}`;
      li.setAttribute(
	"data-fulltext",
	`${sheet.title} ${sheet.authors.join(" ")}`.toLowerCase(),
      );
      fragment.appendChild(li);
    }
    sheets.appendChild(fragment);
  }
  display(sheetId, bookId) {
    const sheet = data.sheets.find(s => s.id === sheetId);
    if (!sheet) { return; }
    if (sheetId === this.curSheetId && bookId === undefined) {
      const idx = sheet.books.findIndex(id => id === this.curBookId);
      bookId = sheet.books[(idx + 1) % sheet.books.length];
    } else if (bookId === undefined) {
      bookId = sheet.books[0];
    }
    if (this.curSheetId === sheetId && this.curBookId === bookId) { return; }

    this.curSheetId = sheetId;
    this.curBookId = bookId;
    history.replaceState(null, "", `#${sheetId}/${bookId}`);

    const e = document.getElementById("sheet");
    const c = e.cloneNode();
    c.setAttribute(
      "data",
      `https://therealbook.info/pdfdoc/index/${sheetId}/${bookId}`,
    );
    e.replaceWith(c);

    const title = `${sheet.title} by ${sheet.authors.join(", ")}`;  
    this.title.textContent = title;
    document.title = `${title} — The Real Book`;

    this.alternatives.replaceChildren();
    for (const bookId of sheet.books) {
      const li = document.createElement("li");
      li.textContent = data.books.find(b => b.id === bookId).name;
      if (bookId === this.curBookId) {
	li.classList.add("displayed");
      } else {
	li.addEventListener("click", () => this.display(sheetId, bookId));
      }
      this.alternatives.appendChild(li);
    }
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
const [sheetId, bookId] = location.hash.slice(1).split("/").map(Number);
app.display(sheetId, bookId);
