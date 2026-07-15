import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '@env/environment';
import { AssessmentQuestion, GeoArea, GlobalSettings } from '@core/models';
import { GeoAreaDto, GlobalSettingsDto, mapGeoAreaFromDto, mapGlobalSettingsFromDto } from './dto/master.dto';

@Injectable({ providedIn: 'root' })
export class MasterApi {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/master`;

  getGeoAreas(): Observable<GeoArea[]> {
    return this.http.get<GeoAreaDto[]>(`${this.base}/geo-areas`).pipe(map((dtos) => dtos.map(mapGeoAreaFromDto)));
  }

  getGlobalSettings(): Observable<GlobalSettings> {
    return this.http.get<GlobalSettingsDto>(`${this.base}/settings`).pipe(map(mapGlobalSettingsFromDto));
  }

  getAssessmentQuestions(): Observable<AssessmentQuestion[]> {
    return this.http.get<AssessmentQuestion[]>(`${this.base}/assessment-questions`);
  }
}
