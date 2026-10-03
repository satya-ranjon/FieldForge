import React from 'react';
import type { Metadata } from 'next';
import { ResourcesLibrary } from '../../components/resources/ResourcesLibrary';

export const metadata: Metadata = {
  title: 'Resources | FieldForge',
  description:
    'Practical field operations guides, illustrative case studies, planning templates, and help articles for your team.'
};

export default function ResourcesPage(): React.JSX.Element {
  return <ResourcesLibrary />;
}
