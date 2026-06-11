import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  PHOTO_STORAGE_BUCKET,
  buildPhotoStoragePath,
  inferImageExtension,
  isLocalPhotoSource,
  normalizeImageExtension,
} from '../src/js/core/photoPaths.js';

test('photo path helpers expose stable bucket and storage paths', () => {
  assert.equal(PHOTO_STORAGE_BUCKET, 'snapquest-photos');
  assert.equal(
    buildPhotoStoragePath({
      userId: 'user-123',
      itemId: 'fighter-abc',
      entity: 'fighters',
      isCatalog: false,
      extension: 'jpeg',
    }),
    'users/user-123/fighters/fighter-abc.jpg'
  );
  assert.equal(
    buildPhotoStoragePath({
      itemId: 'card-xyz',
      entity: 'cards',
      isCatalog: true,
      extension: '.png',
    }),
    'catalog/cards/card-xyz.png'
  );
});

test('photo path helpers validate local photo sources and infer extensions', () => {
  assert.equal(isLocalPhotoSource('file://photo.jpg'), true);
  assert.equal(isLocalPhotoSource('data:image/png;base64,AAAA'), true);
  assert.equal(isLocalPhotoSource('blob:http://localhost/photo'), true);
  assert.equal(isLocalPhotoSource('https://cdn.example.com/photo.jpg'), false);
  assert.equal(normalizeImageExtension('jpeg'), 'jpg');
  assert.equal(inferImageExtension('image/webp'), 'webp');
  assert.equal(inferImageExtension('file://photo.final.PNG?x=1'), 'png');
  assert.equal(inferImageExtension('data:image/gif;base64,AAAA'), 'gif');
});
