import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'data/trip_repository.dart';
import 'providers/trips_provider.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final repo = TripRepository();
  final initialTrips = await repo.load();
  runApp(ProviderScope(
    overrides: [
      tripsProvider.overrideWith(
        (ref) => TripsNotifier.preloaded(ref.read(tripRepositoryProvider), initialTrips),
      ),
    ],
    child: const TripLikeJApp(),
  ));
}
