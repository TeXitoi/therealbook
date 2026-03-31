import requests
import re
import json
import time


if __name__ == "__main__":
    try:
        sheets = []
        allBooks = dict()
        for i in range(1, 1195):
            response = requests.get(f"https://therealbook.info/view/index/{i}/")
            title = re.search(r"The song  '(.*)' of", response.text)
            if not title:
                print(f"no sheet for {i}")
                continue
            title = title.group(1)
            authors = re.search(r"\n((?:<a href=[^>]*>[^<]*</a>)+) can be:", response.text).group(1)
            authors = re.findall(r"<a href=[^>]*>([^<]*)</a>", authors)
            authors = list(map(lambda a: a.strip(), authors))
            books = re.search(r"\n([^\n]*Download in PDF format from[^\n]*)\n", response.text).group(1)
            books_iter = re.findall(r'<a href="http://therealbook.info/pdfdoc/index/[0-9]*/([0-9]*)">Download in PDF format from  ([^>]*)</a>', books)
            books = []
            for (bookId, bookName) in books_iter:
                bookId = int(bookId)
                books.append(bookId)
                allBooks[bookId] = bookName
            print(f"{i} {title} {authors}")
            sheets.append({
                "id": i,
                "title": title,
                "authors": authors,
                "books": books,
            })
            time.sleep(1)

        sheets.sort(key=lambda s: s["title"])
        print(allBooks)
        with open("data.js", "w", encoding="utf-8") as file:
            file.write("const data = ")
            file.write(json.dumps({
                "sheets": sheets,
                "books": sorted(
                    map(lambda kv: {"id": kv[0], "name": kv[1]}, allBooks.items()),
                    key=lambda b: b["name"],
                ),
            }, indent=4))
            file.write(";\n")
    except Exception as e:
        print(f"error: {e}")
