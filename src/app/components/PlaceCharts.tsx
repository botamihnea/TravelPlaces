'use client';
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Place } from '../types/place';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface PlaceChartsProps {
  places: Place[];
}

export default function PlaceCharts({ places }: PlaceChartsProps) {
  // Calculate data for rating distribution
  const ratingCounts = places.reduce((acc, place) => {
    const rating = Math.round(place.rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const ratingDistributionData = {
    labels: ['1★', '2★', '3★', '4★', '5★'],
    datasets: [
      {
        label: 'Number of Places',
        data: [1, 2, 3, 4, 5].map(rating => ratingCounts[rating] || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Calculate data for locations
  const locationCounts = places.reduce((acc, place) => {
    acc[place.location] = (acc[place.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = {
    labels: Object.keys(locationCounts),
    datasets: [
      {
        label: 'Places per Location',
        data: Object.values(locationCounts),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Calculate average ratings over time
  const sortedPlaces = [...places].sort((a, b) => a.id - b.id);
  const runningAverages = sortedPlaces.reduce((acc, place, index) => {
    const totalSoFar = acc.length > 0 
      ? acc[acc.length - 1].y * index 
      : 0;
    const newAverage = (totalSoFar + place.rating) / (index + 1);
    acc.push({ x: index + 1, y: newAverage });
    return acc;
  }, [] as { x: number; y: number }[]);

  const averageRatingTrendData = {
    labels: runningAverages.map(point => `Place ${point.x}`),
    datasets: [
      {
        label: 'Average Rating Trend',
        data: runningAverages.map(point => point.y),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
        fill: false,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
        <Bar 
          data={ratingDistributionData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
              title: {
                display: false,
              },
            },
          }}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Places by Location</h3>
        <Pie 
          data={locationData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom' as const,
              },
            },
          }}
        />
      </div>

      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rating Trend</h3>
        <Line 
          data={averageRatingTrendData}
          options={{
            responsive: true,
            plugins: {
              legend: {
                display: false,
              },
            },
            scales: {
              y: {
                min: 0,
                max: 5,
              },
            },
          }}
        />
      </div>
    </div>
  );
} 