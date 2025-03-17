'use client';
import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import EditPlaceForm from '@/app/components/EditPlaceForm';

export default function EditPlacePage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? parseInt(params.id) : -1;

  return (
    <div className="w-full p-4">
      <div className="mb-4">
        <Link href="/" className="text-blue-600 hover:underline">
          &larr; Back to places
        </Link>
      </div>
      <h1 className="text-2xl font-bold mb-4">Edit Place</h1>
      <div className="max-w-lg">
        <EditPlaceForm id={id} />
      </div>
    </div>
  );
} 