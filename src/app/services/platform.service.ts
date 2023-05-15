import {Injectable} from "@angular/core";
import {Share} from "@capacitor/share";
import {isPlatform} from "@ionic/angular";

@Injectable({providedIn: 'root'})
export class PlatformService{
  constructor() {
    Share.canShare().then(canShare => this.canShare = canShare.value);
  }

  canShare = false;
  isIOS = isPlatform('ios');
  isAndroid = isPlatform('android');
  isWeb = !this.isIOS && !this.isAndroid;

}
