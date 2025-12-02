import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart } from 'chart.js/auto';

import { DataService } from '../../services/data.service';
import { Olympic } from '../../models/olympic.model';
import { Participation } from '../../models/participation.model';

@Component({
  selector: 'app-country',
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit, OnDestroy {

  country?: Olympic;
  error = '';
  totalMedals = 0;
  totalAthletes = 0;
  totalEntries = 0;

  private chart?: Chart;

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit(): void {
    const countryName = this.route.snapshot.paramMap.get('countryName');
    if (!countryName) {
      this.error = 'Aucun pays spécifié.';
      return;
    }

    this.dataService.getCountryByName(countryName).subscribe({
      next: (country: Olympic | undefined) => {
        if (!country) {
          this.error = 'Pays introuvable.';
          return;
        }

        this.country = country;
        this.computeStats(country);
        this.buildCountryChart(country);   // 🔴 création du graphique ici
      },
      error: (err: HttpErrorResponse) => {
        console.error('Erreur lors du chargement des données :', err);
        this.error = 'Impossible de charger les données pour ce pays.';
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = undefined;
    }
  }

  private computeStats(country: Olympic): void {
    this.totalEntries = country.participations.length;

    this.totalMedals = country.participations
      .reduce((sum: number, p: Participation) => sum + p.medalsCount, 0);

    this.totalAthletes = country.participations
      .reduce((sum: number, p: Participation) => sum + p.athleteCount, 0);
  }

  private buildCountryChart(country: Olympic): void {
    // Sécurité : détruire l’ancien graphique si on recharge la page
    this.destroyChart();

    const years: number[] = country.participations.map(
      (p: Participation) => p.year
    );

    const medalsByYear: number[] = country.participations.map(
      (p: Participation) => p.medalsCount
    );

    const canvas = document.getElementById('countryChart') as HTMLCanvasElement | null;
    if (!canvas) {
      console.error('Canvas countryChart introuvable');
      return;
    }

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: years,
        datasets: [
          {
            label: 'Médailles par année',
            data: medalsByYear,
            fill: false,
            tension: 0.25
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }
}
