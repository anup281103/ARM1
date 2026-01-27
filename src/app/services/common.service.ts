import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs/internal/Observable';
import { map } from 'rxjs';
import { Gender } from '../models/gender.model';
import { Salutation } from '../models/salutation.model';
import { MaritalStatus } from '../models/marital-status.model';
import { CasteCategory } from '../models/cast-category.model';
import { BloodGroup } from '../models/blood-group.model';
import { Religion } from '../models/religion.model';
import { RetirementBenefitType } from '../models/scheme-type.model';
import { Relationship } from '../models/relationship.model';
import { DisabilityType } from '../models/disability-type.model';
import { Disease } from '../models/disease-type.model';
import { States } from '../models/state.model';
import { District } from '../models/district.model';
import { Year } from '../models/years.model';
import { DocumentTypes } from '../models/document-type.model';

// Define the structure of the API response
interface ApiResponse<T> {
  Status: boolean;
  Message: string[];
  Data: T;
}

@Injectable({
  providedIn: 'root'
})

export class CommonService {

    private baseUrl = environment.master_baseUrl;

    private http = inject(HttpClient);

    constructor() { } 

    // GET (Gender)
    getAllGenders(): Observable<Gender[]> {
    return this.http.get<ApiResponse<Gender[]>>(`${this.baseUrl}Masters/GetAllGenders`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Salutation)
    getSalutation(): Observable<Salutation[]> {
    return this.http.get<ApiResponse<Salutation[]>>(`${this.baseUrl}Masters/GetTitle`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }
    
    // GET (Marital Status)
    getMaritalStatus(): Observable<MaritalStatus[]> {
    return this.http.get<ApiResponse<MaritalStatus[]>>(`${this.baseUrl}Masters/GetMaritalStatus`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Cast Category)
    getCastCategory(): Observable<CasteCategory[]> {
    return this.http.get<ApiResponse<CasteCategory[]>>(`${this.baseUrl}Masters/GetCastCategory`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Blood Group)
    getBloodGroup(): Observable<BloodGroup[]> {
    return this.http.get<ApiResponse<BloodGroup[]>>(`${this.baseUrl}Masters/GetBloodGroup`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Religion)
    getReligion(): Observable<Religion[]> {
    return this.http.get<ApiResponse<Religion[]>>(`${this.baseUrl}Masters/GetReligion`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Scheme Type)
    getSchemeType(): Observable<RetirementBenefitType[]> {
    return this.http.get<ApiResponse<RetirementBenefitType[]>>(`${this.baseUrl}Masters/GetRetirementBenefitType`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Relationship Type)
    getRelationshipType(): Observable<Relationship[]> {
    return this.http.get<ApiResponse<Relationship[]>>(`${this.baseUrl}Masters/GetRelationship`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (State)
    getState(): Observable<States[]> {
    return this.http.get<ApiResponse<States[]>>(`${this.baseUrl}Masters/GetState`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (District)
    getDistrict(stateId: number): Observable<District[]> {
    return this.http.get<ApiResponse<District[]>>(`${this.baseUrl}Masters/GetDistrict?stateId=${stateId}`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // POST: (Document Type)
    getDocumentTypes(): Observable<DocumentTypes[]> {
        return this.http
        .post<ApiResponse<DocumentTypes[]>>(
            `${this.baseUrl}Masters/GetDocumentTypesByGroupId?groupid=2`,
            {} 
        )
        .pipe(
            map(resp => (resp && resp.Data ? resp.Data : []))
        );
    }

    // GET (Years)
    getYear(): Observable<Year[]> {
    return this.http.get<ApiResponse<Year[]>>(`${this.baseUrl}Masters/GetAllYears`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Disability Type)
    getAllDisabilityType(): Observable<DisabilityType[]> {
    return this.http.get<ApiResponse<DisabilityType[]>>(`${this.baseUrl}Masters/GetAllDisabilityType`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }

    // GET (Disease Type)
    getAllDiseaseType(): Observable<Disease[]> {
    return this.http.get<ApiResponse<Disease[]>>(`${this.baseUrl}Masters/GetAllDiseaseType`)
      .pipe(
        map(resp => resp.Status && resp.Data ? resp.Data : [])
      );
    }
}