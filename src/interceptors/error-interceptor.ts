import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HTTP_INTERCEPTORS } from '@angular/common/http';
import { Observable } from 'rxjs/Rx'; // IMPORTANTE: IMPORT ATUALIZADO
import { StorageService } from '../services/storage.service';
import { AlertController } from 'ionic-angular';
import { FieldMessage } from '../models/fieldmessage';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(public storage: StorageService, public alterCtrl: AlertController) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        //console.log("Passou no interceptor");
        return next.handle(req)
            .catch((error, caught) => {

                let errorObj = error;
                if (errorObj.error) {
                    errorObj = errorObj.error;
                }
                if (!errorObj.status) {
                    errorObj = JSON.parse(errorObj);
                }

                console.log("Erro detectado pelo interceptor:");
                console.log(errorObj);

                switch (errorObj.status) {

                    case 401:
                        this.handle401()
                        break;

                    case 403:
                        this.handle403();
                        break;

                    case 422:
                        this.handle422(errorObj);

                    default:
                        this.handleDefaultError(errorObj);
                }

                return Observable.throw(errorObj);//propagar o erro para o controlador que faz a requisição...


                //return Observable.throw(error);
            }) as any;
    }

    handle401() {
        let alert = this.alterCtrl.create({
            title: 'Erro 401; falha de autenticação',
            message: 'Email ou senha incorretos',
            enableBackdropDismiss: false,//é opcional, mas isso não deixa clicar fora do alert, obriga a apertar algum botão
            buttons: [
                {
                    text: 'OK'
                }
            ]
        });
        alert.present();
    }

    handle403() {
        this.storage.setLocalUser(null);
    }

    handle422(errorObj) {
        let alert = this.alterCtrl.create({
            title: 'Erro 422: Validação',
            message: this.listErrors(errorObj.errors),
            enableBackdropDismiss: false,//é opcional, mas isso não deixa clicar fora do alert, obriga a apertar algum botão
            buttons: [
                {
                    text: 'OK'
                }
            ]
        });
        alert.present();
    }

    handleDefaultError(errorObj) {
        let alert = this.alterCtrl.create({
            title: 'Erro ' + errorObj.status + ': ' + errorObj.error,
            message: errorObj.message,
            enableBackdropDismiss: false,//é opcional, mas isso não deixa clicar fora do alert, obriga a apertar algum botão
            buttons: [
                {
                    text: 'OK'
                }
            ]
        });
        alert.present();
    }

    private listErrors(messages: FieldMessage[]): string {
        let s: string = '';
        for (var i = 0; i < messages.length; i++) {
            s = s + '<p><strong>' + messages[i].fieldName + "</strong>: " + messages[i].message + '</p>';
        }
        return s;
    }

}

export const ErrorInterceptorProvider = {
    provide: HTTP_INTERCEPTORS,
    useClass: ErrorInterceptor,
    multi: true,
};