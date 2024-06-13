# Code für die Aufgabe "Programmiersprachen bei der codecentric"

Um die gemeinsame Datenbasis zu erstellen, habe ich zunächst die GitHub API durchsucht und den folgenden Endpunkt gefunden: `/repos/{username}/{repo}/languages`.
Dieser Endpunkt liefert eine Aufstellung der Bytes pro Programmiersprache für ein Repository eines Users.

Ich gehe davon aus, dass eine Entwicklerin oder ein Entwickler eine Programmiersprache beherrscht, sobald eines ihrer oder seiner Repositories diese Sprache enthält. Unter dieser Annahme können wir zunächst die Mitglieder von "codecentric" über den Endpunkt `/orgs/codecentric/members` abrufen. Im Anschluss können über den Endpunkt `/users/{username}/repos` die Repositories jedes Mitglieds abgerufen werden. Mit diesen beiden Abfragen haben wir alle benötigten Daten, um den Endpunkt `/repos/{username}/{repo}/languages` abzurufen, der die verwendeten Sprachen eines Repositories des jeweiligen Mitglieds zurückgibt.

Aus diesen Daten können wir ein Objekt der folgenden Form erstellen:
```javascript 
{
  "organization": "codecentric",
  "username": "{username}",
  "repo": "{repo}",
  "lang": "{language}"
}
```
Für jede Sprache pro Projekt von jedem Mitglied wird ein Eintrag in der SQLite-Datenbank gespeichert. Damit die Datenbasis in der Datenbank aktuell bleibt und Änderungen berücksichtigt werden, wird dieser Synchronisationsprozess über einen Cronjob regelmäßig ausgeführt. Derzeit ist ein täglicher Intervall mit einer Ausführung um 22 Uhr eingestellt.

Um mit den Daten zu arbeiten, habe ich eine kleine REST-API auf Basis von NEST.js gebaut. Diese kann alle gespeicherten Daten über den Endpunkt `/all` zurückgeben. Zusätzlich habe ich testweise den Endpunkt `/browse/members?lang=` implementiert, um nach Entwicklerinnen und Entwicklern mit bestimmten Fähigkeiten zu suchen.

Die gewonnene Datenbasis habe ich über den Endpunkt `/all` abgerufen und in die folgende [JSON-Datei](./data/Gemeinsame_Datenbasis.json) exportiert. Eine Auflistung aller Scala-Entwicklerinnen und -Entwickler (`/browse/members/?lang=Scala`) habe ich in [diese](./data/Scala_Entwickler.json) JSON-Datei exportiert.

#### Anwendung starten
1. Mit `nvm use` die Node-Version auswählen (es wird Node v20.* benötigt).
2. Abhängigkeiten mit `npm i` installieren.
3. Anwendung über `npm run start` starten.