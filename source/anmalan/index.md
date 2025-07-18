---
title: Anmälan
date: 2021-01-28 12:26:22
---

<!--<h3>
Anmälan är inte öppen än för allmänheten, vänligen återkom senare till denna sida, då kommer du att hitta ett
anmälningsformulär här.
</h3>-->

<script defer>
const endpoint = 'http://sti-starcraft.org:3000/graphql';
//const endpoint = 'http://localhost:3000/graphql';
var members;

if (window.location.href.startsWith('https')) {
  setTimeout(() => {
    const box = document.getElementById('registerContainer');
    box.innerHTML = '';
  
    const link = document.createElement('a');
    link.setAttribute('href', 'http://sti-starcraft.org/form.php');
    link.setAttribute('target', '_blank');
    link.innerText = 'Klicka här för att komma till anmälningsformuläret';
    link.style.fontSize = '25px';
  
    box.appendChild(link);
  }, 100);
}

const validateEmail = email => {
  const regex = /[^\s@]+@[^\s@]+\.[^\s@]+/;
  return !!(email.match(regex) && email.match(regex).length === 1 && email.match(regex)[0] === email);
}

const validateSSN = ssn => {
  const allowedSSNRegexPatterns = [
    /[0-9]{10,10}/g, // YYMMDDXXXX
    /[0-9]{12,12}/g, // YYYYMMDDXXXX
    /[0-9]{8,8}-[0-9]{4,4}/g, // YYYYMMDD-XXXX
    /[0-9]{6,6}-[0-9]{4,4}/g // YYMMDD-XXXX
  ];
  return allowedSSNRegexPatterns.some(regex =>
    ssn.match(regex) &&
    ssn.match(regex).length === 1 &&
    ssn.match(regex)[0] === ssn
  );
}

function submitMember(firstName, lastName, ssn, email, trainingGroup, memberLastTerm = 0, lastTermTrainingGroup = '', message = '', gender = '') {
    message = message.replaceAll('\n', ' ');

    const query =
    `mutation {
      addMember(
        firstName:"${firstName}"
        lastName:"${lastName}"
        ssn:"${ssn}"
        message:"${message}"
        email:"${email}"
        trainingGroup:"${trainingGroup}"
        memberLastTerm:${memberLastTerm}
        lastTermTrainingGroup:"${lastTermTrainingGroup}"
        gender:"${gender}"
      ) {
        firstName
        lastName
        ssn
        email
        message
        trainingGroup
        memberLastTerm
        lastTermTrainingGroup
        gender
      }
    }`;
  return fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query })
  }).then(r => r.json()).then(resp => {
    if (resp && resp.data && resp.data.addMember && resp.data.addMember.firstName && resp.data.addMember.lastName) {
      // Success
      document.getElementById('successBox').style.display = 'block';
      document.getElementById('signupForm').style.display = 'none';
    } else {
      document.getElementById('failBox').style.display = 'block';
      document.getElementById('signupForm').style.display = 'none';
      document.querySelector('#failBox p').innerHTML = JSON.stringify(resp, null, 4);
      console.error(resp);
    }
    window.scrollTo(0,0);
  }).catch(err => {
    document.getElementById('failBox').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.querySelector('#failBox p').innerHTML = JSON.stringify(err, null, 4);
    window.scrollTo(0,0);
    console.error(err);
  });
}

function fetchAllSubmissions() {
    var query = `query {
    members {
      id
      firstName
      lastName
      ssn
      trainingGroup
      submissionDate
    }
  }`;
  fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query
    })
  }).then(r => r.json()).then(resp => {
    console.log('data returned:', resp);
    members = resp.data.members;

    /* const nyborjare_count = members.filter(x => x.trainingGroup === 'Nybörjargruppen').length;
    const fortsattare_count = members.filter(x => x.trainingGroup === 'Fortsättargruppen').length;
    const avancerade_count = members.filter(x => x.trainingGroup === 'AvanceradeGruppen').length;
    const tavling_count = members.filter(x => x.trainingGroup === 'Tävlingsgruppen').length;
    const morgon_count = members.filter(x => x.trainingGroup === 'MorgonFörmiddag').length;

    document.querySelector('#trainingGroup option:nth-child(2)').innerText += ` (${nyborjare_count} anmälda)`;
    document.querySelector('#trainingGroup option:nth-child(3)').innerText += ` (${fortsattare_count} anmälda)`;
    document.querySelector('#trainingGroup option:nth-child(4)').innerText += ` (${avancerade_count} anmälda)`;
    document.querySelector('#trainingGroup option:nth-child(5)').innerText += ` (${tavling_count} anmälda)`;
    document.querySelector('#trainingGroup option:nth-child(6)').innerText += ` (${morgon_count} anmälda)`; */
  }).catch(console.error);
}

function setListeners() {
  // VALIDATE EMAIL
  [...document.querySelectorAll('#mail1, #mail2')].forEach(x => {
    console.log(x)
    x.addEventListener('change', ev => {
      const email1 = document.getElementById('mail1').value;
      const email2 = document.getElementById('mail2').value;
      if (email1 !== email2) {
        document.getElementById('emailErrorMessage').style.display = 'block';
        document.querySelector('#emailErrorMessage div').innerText = 'Mail-adresserna stämmer inte överens med varandra';
        document.getElementById('mail1').style.backgroundColor = '#ffd8d8';
        document.getElementById('mail2').style.backgroundColor = '#ffd8d8';
      } else {
        document.getElementById('emailErrorMessage').style.display = 'none';
        document.getElementById('mail1').style.backgroundColor = 'white';
        document.getElementById('mail2').style.backgroundColor = 'white';
      }
    })
  });
  document.getElementById('trainingGroup').addEventListener('change', ev => {
    if (document.getElementById('trainingGroup').value !== 'none') {
      document.getElementById('trainingGroupDescription').style.display = 'block';

      /* <option value="Nybörjargruppen">Nybörjargruppen</option>
      <option value="Fortsättargruppen">Fortsättargruppen</option>
      <option value="AvanceradeGruppen">Avancerade gruppen</option>
      <option value="Tävlingsgruppen">Tävlingsgruppen</option>
      <option value="MorgonFörmiddag">Endast morgon/förmiddag</option> */

      if (document.getElementById('trainingGroup').value === 'Nybörjargruppen') {
        document.querySelector('#trainingGroupDescription div').innerHTML =
        `<strong>NYBÖRJARGRUPPEN:</strong> Ingen tidigare erfarenhet krävs. Här lär man sig thaiboxning från grunden, steg för steg, av våra duktiga instruktörer. Det spelar ingen roll vilken form du är i, alla är välkomna att komma och lära sig muay thai hos oss! <strong>Som nybörjare får du provträna gratis första veckan innan du bestämmer dig ifall du vill fortsätta eller inte.</strong>`;
      } else if (document.getElementById('trainingGroup').value === 'Fortsättargruppen') {
        document.querySelector('#trainingGroupDescription div').innerHTML =
        `<strong>FORTSÄTTARGRUPPEN:</strong> För den som har lite erfarenhet men fortfarande är ganska ny inom sporten. Minst 1-2 terminers erfarenhet av thaiboxning. Den naturliga fortsättningen för den som redan tränat i nybörjargruppen.`;
      } else if (document.getElementById('trainingGroup').value === 'AvanceradeGruppen') {
        document.querySelector('#trainingGroupDescription div').innerHTML =
        `<strong>AVANCERADE GRUPPEN:</strong> För dig som är erfaren av thaiboxning och klarar av att hålla en avancerad nivå. Du ska behärska alla thaiboxningstekniker och vara bekväm med sparringmoment och hård träning.`;
      } else if (document.getElementById('trainingGroup').value === 'Tävlingsgruppen') {
        document.querySelector('#trainingGroupDescription div').innerHTML =
        `<strong>TÄVLINGSGRUPPEN:</strong> I tävlingsgruppen tävlar man. Det är hårda krav på medlemmar i denna gruppen. Du måste få godkänt av en tränare för att få träna i denna gruppen, för att säkerställa att du är redo. Du har mycket hög närvaro på klubben och tar stort eget ansvar för din utveckling & din fysik. Vid undermålig prestation får du byta grupp - det är ingen lek i denna grupp.`;
      } else if (document.getElementById('trainingGroup').value === 'MorgonFörmiddag') {
        document.querySelector('#trainingGroupDescription div').innerHTML =
        `<strong>MORGON/FÖRMIDDAGS-GRUPPEN:</strong> Detta är ett alternativ för dig som kan tänka dig att ENDAST träna på morgonen/förmiddagen, INTE standardpassen som är på kvällar/eftermiddag. Se schemat. Notera att dessa pass är fripass och inte ledda av instruktörer. Du som väljer detta får betala en reducerad terminsavgift.`;
      } else {
        document.getElementById('trainingGroupDescription').style.display = 'none';
      }
    } else {
      document.getElementById('trainingGroupDescription').style.display = 'none';
    }
  });
  document.getElementById('memberLastTerm').addEventListener('change', ev => {
    let checked = document.getElementById('memberLastTerm').checked;
    if (checked) {
      document.getElementById('lastTermMembership').classList.remove('disabled');
    } else {
      document.querySelector('#lastTermMembership select').value = 'none';
      document.getElementById('lastTermMembership').classList.add('disabled');
    }
  });
  // SUBMIT BUTTON
  document.getElementById('submitButton').addEventListener('click', ev => {
    let message = '';
    let errorFound = false;

    if (!document.getElementById('firstName').value) {
      message += 'Förnamn saknas\n';
      errorFound = true;
    }
    if (!document.getElementById('lastName').value) {
      message += 'Efternamn saknas\n';
      errorFound = true;
    }
    if (!document.getElementById('ssn').value) {
      message += 'Personnummer saknas\n';
      errorFound = true;
    } else if (!validateSSN(document.getElementById('ssn').value)) {
      message += 'Personnummer har felaktigt format\n';
      errorFound = true;
    }
    if (!document.getElementById('mail1').value || !document.getElementById('mail2').value) {
      message += 'E-post saknas\n';
      errorFound = true;
    } else if (document.getElementById('mail1').value !== document.getElementById('mail2').value) {
      message += 'E-post-adresserna stämmer inte överens med varandra\n';
      errorFound = true;
    } else if (!validateEmail(document.getElementById('mail1').value)) {
      message += 'Email-adressen har ett felaktigt format\n';
      errorFound = true;
    }
    if (!document.getElementById('trainingGroup').value || document.getElementById('trainingGroup').value === 'none') {
      message += 'Träningsgrupp saknas\n';
      errorFound = true;
    }
    if (!document.getElementById('genderSelect').value || document.getElementById('genderSelect').value === 'none') {
      message += 'Kön ej valt\n';
      errorFound = true;
    }
    if (document.getElementById('memberLastTerm').checked) {
      if (!document.getElementById('trainingGroup2').value || document.getElementById('trainingGroup2').value === 'none') {
        message += 'Träningsgrupp förra terminen saknas\n';
        errorFound = true;
      }
    }

    if (errorFound) {
      document.getElementById('mainErrorMessage').style.display = 'block';
      document.querySelector('#mainErrorMessage div').innerText = message;
    } else {
      // Submit

      document.getElementById('submitButton').setAttribute('disabled', '');

      document.getElementById('mainErrorMessage').style.display = 'none';
      document.querySelector('#mainErrorMessage div').innerText = '';
      submitMember(
        document.getElementById('firstName').value,
        document.getElementById('lastName').value,
        document.getElementById('ssn').value,
        document.getElementById('mail1').value,
        document.getElementById('trainingGroup').value,
        document.getElementById('memberLastTerm').checked ? 1 : 0,
        document.getElementById('trainingGroup2').value === 'none' ? '': document.getElementById('trainingGroup2').value,
        document.getElementById('memberMessage').value,
        document.getElementById('genderSelect').value
      ).then(() => {
        document.getElementById('submitButton').removeAttribute('disabled');
      })
    }
  });
}

document.addEventListener("DOMContentLoaded", function(){
  fetchAllSubmissions();
  setListeners();
});

</script>

<style>
    #signup {
        width: 100%;
        margin-top: 15px;
    }
    #signup .signup__row {
        display: flex;
        flex-direction: row;
        flex-wrap: nowrap;
        align-items: flex-start;
        align-content: center;
        justify-content: center;
    }
    #signup .signup__row.info, #signup .signup__row.error {
      display: block;
      border-radius: 8px;
      box-shadow: 0 5px 10px #0000003d;
      color: black;
    }
    #signup .signup__row.disabled {
      pointer-events: none;
      user-select: none;
      color: gainsboro;
    }
    #signup .signup__row.disabled select {
      border-color: gainsboro;
      color: gainsboro;
    }
    #signup .signup__row.info {
      background: #b0b5ef;
    }
    #signup .signup__row.error {
      background: #ffd8d8;
    }
    #signup .signup__row .signup__column {
        padding: 10px;
    }
    #signup span.mandatory {
        color: red;
    }
    #signup span.mandatory:before {
        content: '*'
    }
    #signup .signup__row .signup__column:first-child {
        font-size: 1.6em;
        width: 40%;
    }
    #signup .signup__row .signup__column:last-child {
        font-size: 1.6em;
        width: 60%;
        padding-right: 20px;
    }
    #signup .signup__row .signup__column.double.center {
        text-align: center;
    }
    #signup .signup__row .signup__column.double {
      width: calc(100% - 40px);
    }
    #signup .signup__row .signup__column input[type=text] {
        font-size: 1.2em;
        width: 100%;
        border-radius: 5px;
        padding: 3px 10px;
    }
    #signup .signup__row .signup__column textarea {
        font-size: 0.6em;
        width: 100%;
        height: 140px;
        border-radius: 5px;
        padding: 3px 10px;
        resize: none;
    }
    #signup .signup__row .signup__column select {
        width: 100%;
        border-radius: 5px;
        padding: 3px 10px;
        font-size: 0.8em;
    }
    #signup .signup__row .signup__column input[type=checkbox] {
        width: 25px;
        height: 25px;
    }
    #signup #submitButton {
        font-size: 1.5em;
        padding: 8px 50px;
        outline: none;
        border: 2px solid black;
        border-radius: 5px;
        outline: none;
        background-color: #0fe628;
        cursor: pointer;
    }
    #signup #submitButton:hover {
        background-color: #98ffa4;
    }
    #signup #submitButton {
        font-size: 1.5em;
        padding: 8px 50px;
        outline: none;
        border: 2px solid black;
        border-radius: 5px;
        outline: none;
        background-color: #0fe628;
        cursor: pointer;
    }
    #successBox, #failBox {
      text-align: center;
    }
    #successBox h3 {
      font-size: 2em;
    }
    #successBox p {
      font-size: 1.3em;
    }
    #successBox #checkboxContainer {
      text-align: center;
    }
    #successBox #checkboxContainer svg {
      width: 250px;
      height: 250px;
      fill: #3bce3b;
      border: 10px solid #3bce3b;
      border-radius: 50%;
      padding: 20px;
      filter: drop-shadow(2px 4px 6px gainsboro);
    }
</style>
 
<div id="registerContainer">
  <div id="successBox" style="display: none;">
    <div id="checkboxContainer">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg>
    </div>
    <h3>
      Tack för din anmälan!
    </h3>
    <p>
      Du är härmed anmäld och bör ha fått ett automatiskt bekräftelse-mail till epost-adressen du angav. Vänligen anmäl dig inte mer gång än en.
    </p>
  </div>
  <div id="failBox" style="display: none;">
    <h3>
      Något gick fel med din anmälan
    </h3>
    <p></p>
  </div>
  <form action="javascript:void(0);" id="signupForm">
    <div id="signup">
        <div class="signup__row">
            <div class="signup__column">
                Förnamn <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <input type="text" id="firstName" maxlength="55" />
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Efternamn <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <input type="text" id="lastName" maxlength="55" />
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Fullständigt personnummer <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <input type="text" id="ssn" maxlength="55" placeholder="YYYYMMDDXXXX" />
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column double" style="font-size: 1em">
                <strong>Det är viktigt att du anger en korrekt email-adress, eftersom vi behöver kontakta dig för att bekräfta din ansökan.</strong>
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                E-post <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <input type="text" id="mail1" maxlength="55" placeholder="mail@mailhost.com" />
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Verifiera E-post <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <input type="text" id="mail2" maxlength="55" placeholder="mail@mailhost.com" />
            </div>
        </div>
        <div class="signup__row error" style="display: none;" id="emailErrorMessage">
            <div class="signup__column double" style="font-size: 1em">
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Meddelande till tränarna (valfritt)
            </div>
            <div class="signup__column">
                <textarea id="memberMessage" maxlength="450" placeholder="Valfritt meddelande om du har något speciellt du känner att du vill tillägga"></textarea>
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Träningsgrupp <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <select id="trainingGroup">
                    <option value="none">VÄLJ EN GRUPP</option>
                    <option value="Nybörjargruppen">Nybörjargruppen</option>
                    <option value="Fortsättargruppen">Fortsättargruppen</option>
                    <option value="AvanceradeGruppen">Avancerade gruppen</option>
                    <option value="Tävlingsgruppen">Tävlingsgruppen</option>
                    <option value="MorgonFörmiddag">Endast morgon/förmiddag</option>
                </select>
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Kön <span class="mandatory"></span>
            </div>
            <div class="signup__column">
                <select id="genderSelect">
                    <option value="none">VÄLJ</option>
                    <option value="male">Kille</option>
                    <option value="female">Tjej</option>
                </select>
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column double" style="font-size: 1em" id="chosenGroupInfo"></div>
        </div>
        <div class="signup__row info" id="trainingGroupDescription" style="display: none; margin-bottom: 10px;">
            <div class="signup__column double" style="font-size: 1em"></div>
        </div>
        <div class="signup__row info">
            <div class="signup__column double" style="font-size: 1em">
                <span style="font-weight: 900; color: red;">OBS!</span> Detta val gäller vilken grupp du helst VILL träna i. Tränare på Lejonkulan har alltid rätt att placera dig i en annan grupp. Om du t.ex väljer Tävlingsgruppen, som är den gruppen med högst krav, så är det inte garanterat att du får träna i den gruppen ifall tränare på Lejonkulan anser att du platsar bättre i Avancerade gruppen.
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column">
                Var du medlem hos oss förra terminen?
            </div>
            <div class="signup__column">
                <input type="checkbox" id="memberLastTerm" />
            </div>
        </div>
        <div class="signup__row disabled" id="lastTermMembership">
            <div class="signup__column">
                Om ja på föregående, vilken grupp var du i då?
            </div>
            <div class="signup__column">
                <select id="trainingGroup2">
                    <option value="none">VÄLJ EN GRUPP</option>
                    <option value="Nybörjargruppen">Nybörjargruppen</option>
                    <option value="Fortsättargruppen">Fortsättargruppen</option>
                    <option value="AvanceradeGruppen">Avancerade gruppen</option>
                    <option value="Tävlingsgruppen">Tävlingsgruppen</option>
                    <option value="MorgonFörmiddag">Endast morgon/förmiddag</option>
                </select>
            </div>
        </div>
        <div class="signup__row error" style="display: none;" id="mainErrorMessage">
            <div class="signup__column double" style="font-size: 1em">
            </div>
        </div>
        <div class="signup__row">
            <div class="signup__column double center">
                <button id="submitButton">
                    Ansök
                </button>
            </div>
        </div>
    </div>
  </form>
</div>