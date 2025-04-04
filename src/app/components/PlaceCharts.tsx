'use client';
import React from 'react';
import { Place } from '../types/place';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement
);

interface PlaceChartsProps {
  places: Place[];
}

export default function PlaceCharts({ places }: PlaceChartsProps) {
  // Rating Distribution Chart
  const ratingDistribution = places.reduce((acc, place) => {
    acc[place.rating] = (acc[place.rating] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const ratingData = {
    labels: ['1★', '2★', '3★', '4★', '5★'],
    datasets: [
      {
        label: 'Number of Places',
        data: [1, 2, 3, 4, 5].map(rating => ratingDistribution[rating] || 0),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Location Distribution Chart
  const locationDistribution = places.reduce((acc, place) => {
    acc[place.location] = (acc[place.location] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const locationData = {
    labels: Object.keys(locationDistribution),
    datasets: [
      {
        label: 'Places per Location',
        data: Object.values(locationDistribution),
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Rating Trends Chart (using place IDs as time)
  const ratingTrendsData = {
    labels: places.map(place => place.id),
    datasets: [
      {
        label: 'Rating',
        data: places.map(place => place.rating),
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rating Distribution</h3>
        <Bar data={ratingData} options={chartOptions} />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Location Distribution</h3>
        <Bar data={locationData} options={chartOptions} />
      </div>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Rating Trends</h3>
        <Line data={ratingTrendsData} options={chartOptions} />
      </div>
    </div>
  );
} 