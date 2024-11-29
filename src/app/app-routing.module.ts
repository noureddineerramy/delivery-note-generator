import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainComponent } from './main/main.component';
import { BcComponent } from './bc/bc.component';

const routes: Routes = [
  { path: '', component: MainComponent },
  { path: 'bc', component: BcComponent } // Define a new route for '/bc'
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
