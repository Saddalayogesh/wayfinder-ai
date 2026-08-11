package com.tripplanner.favorite;

import com.tripplanner.exception.FavoriteNotFoundException;
import com.tripplanner.favorite.dto.FavoriteRequest;
import com.tripplanner.favorite.dto.FavoriteResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Favorites are scoped to the signed-in user: listing only returns the
 * caller's favorites, and deleting a favorite belonging to another user
 * raises {@link AccessDeniedException} (403).
 */
@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;

    public FavoriteService(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    /** Saves a favorite. Idempotent: re-favoriting the same place returns the existing entry. */
    @Transactional
    public FavoriteResponse addFavorite(Long userId, FavoriteRequest request) {
        return favoriteRepository.findByUserIdAndPlaceId(userId, request.placeId().trim())
                .map(FavoriteResponse::from)
                .orElseGet(() -> FavoriteResponse.from(favoriteRepository.save(
                        new Favorite(userId, request.placeId().trim(), request.placeName().trim()))));
    }

    @Transactional(readOnly = true)
    public List<FavoriteResponse> listFavorites(Long userId) {
        return favoriteRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(FavoriteResponse::from)
                .toList();
    }

    @Transactional
    public void removeFavorite(Long userId, Long favoriteId) {
        Favorite favorite = favoriteRepository.findById(favoriteId)
                .orElseThrow(() -> new FavoriteNotFoundException("Favorite not found"));
        if (!favorite.getUserId().equals(userId)) {
            throw new AccessDeniedException("You do not have access to this favorite");
        }
        favoriteRepository.delete(favorite);
    }
}
