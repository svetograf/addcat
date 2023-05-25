import {AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, ViewChild} from '@angular/core';
import {BehaviorSubject, catchError, filter, Subject, Subscription, switchMap, tap} from "rxjs";
import {
  FaceMesh, FACEMESH_FACE_OVAL
} from "@mediapipe/face_mesh";
import {drawConnectors} from "@mediapipe/drawing_utils";
import FloodFill from "q-floodfill";
import {ToastService} from "../services/toast.service";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {Share} from "@capacitor/share";
import {PlatformService} from "../services/platform.service";
// @ts-ignore
import {saveAs} from "file-saver";

@Component({
  selector: 'app-add-pet',
  templateUrl: './add-pet.component.html',
  styleUrls: ['./add-pet.component.scss'],
})
export class AddPetComponent implements OnDestroy, AfterViewInit {
  @ViewChild('previewImage') previewImageRef?:ElementRef;
  @ViewChild('canvas') canvasRef?:ElementRef;
  @ViewChild('mask') maskRef?:ElementRef;

  folder = 'AddPet';
  faceMesh: FaceMesh;
  saveFile$ = new Subject<null>();
  previewImage$ = new BehaviorSubject<string | null>(null);
  finalImage$ = new BehaviorSubject<string | null>(null);
  imageLoaded$ = new Subject<void>();
  showSpinner$ = new BehaviorSubject(false);
  faceDetected$ = new BehaviorSubject(false);

  previewImageSub?: Subscription;

  width: number = 0;
  height: number = 0;
  get maxDimensions(){
    return Math.max(this.width, this.height);
  }
  originalWidth: number = 0;
  originalHeight: number = 0;

  readonly NOSE_TIP = 33;
  readonly MASK_COLOR = '#FFFFFF';

  constructor(
    private toaster: ToastService,
    private http: HttpClient,
    private cd: ChangeDetectorRef,
    public platform: PlatformService,
  ) {
    this.faceMesh = new FaceMesh({locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`});
    this.faceMesh.setOptions({
      maxNumFaces: 10,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    this.faceMesh.onResults(this.processFaceMeshResults.bind(this));

    this.saveFile$.pipe(
      switchMap(() => this.finalImage$)
    ).subscribe((fileName) => saveAs(fileName, 'ai-image.png'));
  }

  loadImageFromDevice($event: Event) {
    this.resetForm();
    const element = $event.currentTarget as HTMLInputElement;
    let fileList: FileList | null = element.files;
    if (fileList) {
      const reader = new FileReader();
      reader.readAsDataURL(fileList[0]);
      reader.onload = () => {
        const img = new Image;
        img.onload = () => {
          this.originalWidth = img.width ?? 0;
          this.originalHeight = img.height ?? 0;
          this.calculateCanvasSize();
          this.imageLoaded$.next();
        }
        if (reader.result){
          img.src = reader.result as string;
        }
        this.previewImage$.next(reader.result as string);
      };
      reader.onerror = (error) => {
        this.toaster.toast('Error loading the photo');
        console.log(error);
      };
    }
  }

  async processFaceMeshResults(results: any){
    if(this.canvasRef?.nativeElement && this.maskRef?.nativeElement){
      this.resetCanvas();
      const photoCanvasCtx = this.canvasRef?.nativeElement.getContext('2d');
      const maskCanvasCtx = this.maskRef?.nativeElement.getContext('2d');
      photoCanvasCtx.clearRect(0, 0, this.width, this.height);
      maskCanvasCtx.clearRect(0, 0, this.width, this.height);
      photoCanvasCtx.drawImage(results.image, 0, 0, this.width, this.height);
      if (results.multiFaceLandmarks?.length) {
        this.faceDetected$.next(true);
        console.log(results.multiFaceLandmarks);
        // let FaceMesh helper draw the outline
        for (const landmarks of results.multiFaceLandmarks) {
          drawConnectors(maskCanvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: this.MASK_COLOR});
        }

        const imgData = maskCanvasCtx.getImageData(0, 0, this.width, this.height);
        const floodFill = new FloodFill(imgData);
        // then fill it solid
        for (const landmarks of results.multiFaceLandmarks) {
          floodFill.fill(
            this.MASK_COLOR,
            Math.floor(this.width * landmarks[this.NOSE_TIP].x),
            Math.floor(this.height * landmarks[this.NOSE_TIP].y),
            254);
        }

        maskCanvasCtx.putImageData(floodFill.imageData, 0, 0);

        // apply mask

        const photoImageData = photoCanvasCtx.getImageData(0, 0, this.width, this.height);
        const maskImageData = maskCanvasCtx.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < photoImageData.data.length; i += 4) {
          // copy mask to the alpha channel of the photo
          photoImageData.data[i+3] = maskImageData.data[i+2];
        }
        this.canvasRef.nativeElement.width = this.maxDimensions;
        this.canvasRef.nativeElement.height = this.maxDimensions;
        photoCanvasCtx.putImageData(photoImageData, 0, 0);

        // send it to the api

        await this.sendToOpenAi();

      } else {
        this.faceDetected$.next(false);
        this.toaster.toast('Sorry, no face detected');
        this.resetForm();
      }
      photoCanvasCtx.restore();
    }
  }

  ngAfterViewInit(): void {
    this.previewImageSub = this.previewImage$.pipe(
      filter(img => !!img),
      tap(() => this.showSpinner$.next(true)),
      switchMap(() => this.imageLoaded$),
      tap(() => {
        this.faceMesh.send({image: this.previewImageRef?.nativeElement});
      }),
    )
    .subscribe();
  }

  ngOnDestroy(): void {
    this.previewImageSub?.unsubscribe();
  }

  resetForm(){
    this.previewImage$.next(null);
    this.finalImage$.next(null);
    this.faceDetected$.next(false);
  }

  private resetCanvas(){
    if(this.canvasRef?.nativeElement && this.maskRef?.nativeElement){
      this.canvasRef.nativeElement.width = this.width;
      this.canvasRef.nativeElement.height = this.height;
      this.maskRef.nativeElement.width = this.width;
      this.maskRef.nativeElement.height = this.height;
    }
  }

  reRun(){
    this.showSpinner$.next(true);
     this.sendToOpenAi();
  }

  private async sendToOpenAi() {
    await this.canvasRef?.nativeElement.toBlob( async (blob: Blob) => {
      const formData = new FormData();
      formData.append('image', blob, 'image.png');
      formData.append('prompt', 'human is hugging a pet animal');
      const finalImageData: any = await this.http.post('https://api.openai.com/v1/images/edits', formData, {
        headers: {
          authorization: `Bearer ${environment.openaiToken}`
        }
      }).pipe(
        catchError((err) => {
          console.log(err);
          return this.toaster.toast('Request failed');
        }),
        tap(() => {

        })
      ).toPromise();

      this.showSpinner$.next(false);
      this.previewImage$.next(null);
      this.finalImage$.next(finalImageData?.data?.[0]?.url);
      console.log(finalImageData);
      // todo find out why
      this.cd.detectChanges();

      // todo add some interactive captions for user to wait in comfort
    });
  }

  private calculateCanvasSize(){
    if(this.originalWidth > this.originalHeight){
      this.width = 1000;
      this.height = Math.floor(this.originalHeight/this.originalWidth * 1000);
    } else {
      this.height = 1000;
      this.width = Math.floor(this.originalWidth/this.originalHeight * 1000);
    }
  }

  async share() {
    await Share.share({
      title: 'Look at this photo AddPet edited for me',
      text: 'The only real thing on it is a face',
      url: 'https://github.com/svetograf/addcat/',
      dialogTitle: 'Share',
      files: [this.finalImage$.value ?? '']
    });
  }
}
