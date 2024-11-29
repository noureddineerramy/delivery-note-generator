import { Component, OnInit } from '@angular/core';
import html2pdf from 'html2pdf.js';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ToWords } from 'to-words';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
@Injectable({
  providedIn: 'root'
})
export class MainComponent {
  reference:string = '';
  numero:string = '';
  indice: string = '1';
  dateTime: string = '';
  dateTime2: string = '';
  client: string = '';

  isReferenceInvalid:boolean = false;
  isNumeroInvalid:boolean = false;
  isIndiceInvalid:boolean = false;
  isDateTimeInvalid:boolean = false;
  isDateTime2Invalid:boolean = false;
  isClientInvalid:boolean = false;

  ngOnInit() {
    // Set default value to current date and time
    this.init();
  }

  baseObj = { description: 'Nouveau Produit', largeur:0, hauteur:0, price: 0, quantity: 1,remise: 0 }
  items = [
    {...this.baseObj}
  ];

  toWords = new ToWords({
    localeCode: 'fr-FR',
    converterOptions: {
      currency: true,
      ignoreDecimal: false,
      ignoreZeroCurrency: false,
      doNotAddOnly: true,
      currencyOptions: {
        // can be used to override defaults for the selected locale
        name: 'Dirham',
        plural: 'Dirhams',
        symbol: 'DH',
        fractionalUnit: {
          name: 'Centime',
          plural: 'Centimes',
          symbol: '',
        },
      },
    },
  });

  selectedItemIndex: number | null = null;

  constructor(private http: HttpClient) {}

  init(): void {
    const now = new Date();
    

    this.reference = '';
    this.numero = '';
    this.indice = '1';
    this.dateTime = now.toISOString().slice(0, 16);
    this.dateTime2 = now.toISOString().slice(0, 16);
    this.client = '';
    this.items.splice(0);
    this.items.push({...this.baseObj});
  }

  // Add new item
  addItem(): void {
    this.items.push({...this.baseObj});
    this.selectedItemIndex = this.items.length - 1;  // Automatically select the new item for editing
  }

  // Edit an existing item
  editItem(index: number): void {
    this.selectedItemIndex = index;  // Set the selected item index for editing
  }

  // Delete an item
  deleteItem(index: number): void {
    this.items.splice(index, 1);  // Remove the item from the array
    this.selectedItemIndex = null; // Reset selection
  }

  // Update item (save changes made in the form)
  updateItem(): void {
    if (this.selectedItemIndex !== null) {
      // Handle any additional logic to save changes if needed
      console.log('Item updated:', this.items[this.selectedItemIndex]);
      this.selectedItemIndex = null;  // Reset selection after update
    }
  }

  sendData() {
    let error = false;
    this.isReferenceInvalid = false;
    this.isNumeroInvalid = false;
    this.isIndiceInvalid = false;
    this.isDateTimeInvalid = false;
    this.isDateTime2Invalid = false;
    this.isClientInvalid = false;

    if (!this.reference || this.reference.trim() === '') {
      // Set a flag for invalid reference
      this.isReferenceInvalid = true;
      error = true;
    }
    if(!this.numero || this.numero.trim() === ''){
      this.isNumeroInvalid = true;
      error = true;
    }
    if(!this.indice || this.indice.trim() === ''){
      this.isIndiceInvalid = true;
      error = true;
    }
    if(!this.dateTime || this.dateTime.trim() === ''){
      this.isDateTimeInvalid = true;
      error = true;
    }
    if(!this.dateTime2 || this.dateTime2.trim() === ''){
      this.isDateTime2Invalid = true;
      error = true;
    }
    if(!this.client || this.client.trim() === ''){
      this.isClientInvalid = true;
      error = true;
    }
    if(error){
      return;
    }


    const data = {
      reference:this.reference,
      indice: this.indice,
      dateTime: this.dateTime,
      dateTime2: this.dateTime2,
      client:this.client,
      numero:this.numero,
      items: this.items
    };
    
    this.http.get('assets/template.html', { responseType: 'text' }).subscribe(template => {
      const populatedTemplate = this.populateTemplate(template, data);
      const nameInvoice = 'BC-['+this.client+']['+this.numero+'].pdf';
      const options = {
        margin: [10, 10, 10, 10],
        filename: nameInvoice,
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      // Use html2pdf.js to create a PDF from HTML
      html2pdf()
        .from(populatedTemplate)
        .set(options)
        .save(nameInvoice);
    });
  }

  formatDateTime2(dateTime: string, showTime: boolean = true): string {
    if (!dateTime) return '';
  
    const date = new Date(dateTime); // Convert the string to a Date object
  
    // Define formatting options
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    };
  
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hourCycle = 'h23';
    }
  
    return new Intl.DateTimeFormat('fr-FR', options).format(date);
  }

  populateTemplate(template: string, data: any): string {

    return template
      .replace('{{reference}}',data.reference)
      .replace('{{indice}}', data.indice)
      .replace('{{dateTime}}', this.formatDateTime2(data.dateTime,false))
      .replace('{{numero}}',data.numero)
      .replace('{{dateTime2}}',this.formatDateTime2(data.dateTime2))
      .replace('{{client}}',data.client)
      .replace('{{totalht}}',`${this.getTotalHT().toFixed(2)}`)
      .replace('{{totaltva}}',`${this.getTotalTVA().toFixed(2)}`)
      .replace('{{totalttc}}',`${this.getTotalTTC().toFixed(2)}`)
      .replace('{{poidsTotalKg}}',`${this.getPoidsTotal()}`)
      .replace('{{metrageTotalM2}}',`${this.getMetrageM2().toFixed(2)}`)
      .replace('{{totalInWords}}',this.generateFrenchText(this.getTotalTTC()))
      .replace('{{items}}', data.items.map((item:any) => `
        <tr>
          <td>
            <div class="w-100 text-left">
              ${item.description}
            </div>
          </td>
          <td class="text-center">
            <div class="w-100 text-center">
              ${item.hauteur}
            </div>
          </td>
          <td class="text-center">
            <div class="w-100 text-center">
              ${item.largeur}
            </div>
          </td>
          <td class="text-center">${(this.calculateAreaInSquareMeters(item.hauteur , item.largeur)).toFixed(2)}</td>
          <td class="text-center">${item.price.toFixed(2)}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-center">${item.remise}</td>
          <td class="text-center">${(item.price * this.calculateAreaInSquareMeters(item.hauteur , item.largeur)).toFixed(2)}</td>
          <td class="text-center">${((item.price * this.calculateAreaInSquareMeters(item.hauteur , item.largeur)) * item.quantity).toFixed(2)}</td>
        </tr>
      `).join(''));
  }

  getPoidsTotal(){
    return '0';
  }

  getTotalHT(){
    let result = 0;
    this.items.forEach(item=>{
      result+=((this.calculateAreaInSquareMeters(item.hauteur , item.largeur) * item.price * item.quantity) - ((this.calculateAreaInSquareMeters(item.hauteur , item.largeur) * item.price * item.quantity) * item.remise)/100);
    })
    return result;
  }
  getTotalTVA(){
    return (this.getTotalHT() * 20 / 100);
  }
  getTotalTTC(){
    return this.getTotalHT() + this.getTotalTVA();
  }
  getMetrageM2(){
    let result = 0;
    this.items.forEach(item=>{
      result+=(this.calculateAreaInSquareMeters(item.hauteur , item.largeur) * item.quantity);
    })
    return result;
  }

  generateFrenchText(total: number): string {
    const totalInWords = this.convertToWords(total); // Optional: Implement number-to-words conversion
    return `Arrêté le présent Bon de Commande à la somme de ${totalInWords} .`;
  }

  convertToWords(num: number): string {
    // Placeholder for number-to-words logic in French
    return this.toWords.convert(num); // Formats the number (e.g., "1 234")
  }

  calculateAreaInSquareMeters(largeur:number, hauteur:number):number  {
    // Convert largeur and hauteur from mm to meters
    const largeurMeters = largeur / 1000;
    const hauteurMeters = hauteur / 1000;
  
    // Calculate the area in square meters
    const area = largeurMeters * hauteurMeters;
  
    return area; // Return the result
  }
}
