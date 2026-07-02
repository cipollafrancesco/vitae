import { Profile } from '@/lib/types'
import { IconPerson } from './primitives/Icons'

export function Header({ profile }: { profile: Profile }) {
  return (
    <div className="rp-header" data-rp-section="profile">
      {profile.showPhoto && (
        <div className="rp-photo-wrap" data-rp-field="photo">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt={profile.name ? `Photo of ${profile.name}` : 'Profile photo'}
            />
          ) : (
            <IconPerson className="rp-photo-placeholder" />
          )}
        </div>
      )}
      <div className="rp-header-info">
        <h1 className="rp-name" data-rp-field="name">
          {profile.name || 'Your Name'}
        </h1>
        <p className="rp-role" data-rp-field="role">
          {profile.role}
        </p>
        <p className="rp-summary" data-rp-field="summary">
          {profile.summary}
        </p>
      </div>
    </div>
  )
}
