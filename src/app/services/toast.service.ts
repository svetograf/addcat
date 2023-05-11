import {Injectable} from "@angular/core";
import {ToastController} from "@ionic/angular";

@Injectable({providedIn: 'root'})
export class ToastService{
  constructor(public toastController: ToastController) {
  }

  public async toast(message: string){
    const toast = await this.toastController.create({
      message,
      duration: 1500,
      position: "bottom",
    });

    await toast.present();
  }
}
