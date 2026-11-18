using System;

namespace NecromanteInc
{
    [Serializable]
    public class Catalog
    {
        public Unit[] units;
        public Station[] stations;
        public Automation[] automation;
        public Objective[] objectives;
        public Achievement[] achievements;
    }

    [Serializable]
    public class Unit
    {
        public string id, name, role, description, produces, evolvesTo;
        public double cost, costGrowth, baseRate;
        public int evolutionCost;
        public Upgrade[] upgrades;
    }

    [Serializable]
    public class Upgrade
    {
        public string id, name, description, currency;
        public double cost, multiplier;
        public int requirement;
    }

    [Serializable]
    public class Station
    {
        public string id, name, role, description, effect, group;
        public double baseCost, costGrowth, bonusPerLevel;
    }

    [Serializable]
    public class Automation
    {
        public string id, name, description;
        public double cost, costGrowth, clicksPerSecond;
    }

    [Serializable]
    public class Objective
    {
        public string id, text;
        public int target;
        public double reward;
    }

    [Serializable]
    public class Achievement
    {
        public string id, name, description;
    }

    [Serializable]
    public class GameState
    {
        public double gold, bones, essence, totalGold, xp;
        public int clicks, purchases, objectiveIndex;
        public int level = 1;
        public int[] units, stations, automation;
        public string[] upgrades;
        public bool sound = true;
        public long lastSeen;

        public double Balance(string resource) => resource == "gold" ? gold : resource == "bones" ? bones : essence;

        public void Add(string resource, double amount)
        {
            switch (resource)
            {
                case "gold": gold += amount; break;
                case "bones": bones += amount; break;
                case "essence": essence += amount; break;
            }
        }
    }

    public struct Production
    {
        public double gold, bones, essence;

        public void Add(string resource, double amount)
        {
            switch (resource)
            {
                case "gold": gold += amount; break;
                case "bones": bones += amount; break;
                case "essence": essence += amount; break;
            }
        }
    }

    public sealed class Game
    {
        public readonly Catalog Data;
        public GameState State { get; private set; }

        public Game(Catalog data, GameState saved = null)
        {
            Data = data;
            State = saved ?? new GameState();
            State.level = Math.Max(1, State.level);
            State.objectiveIndex = Math.Max(0, Math.Min(data.objectives.Length, State.objectiveIndex));
            Array.Resize(ref State.units, data.units.Length);
            Array.Resize(ref State.stations, data.stations.Length);
            Array.Resize(ref State.automation, data.automation.Length);
            State.upgrades ??= Array.Empty<string>();
        }

        public static double XpNeeded(int level) => Round(100 * Math.Pow(level, 1.5));
        private static double Round(double value) => Math.Floor(value + 0.5);
        private double LevelMultiplier => 1 + (State.level - 1) * 0.05;

        public double Effect(string effect)
        {
            double result = 1;
            for (int i = 0; i < Data.stations.Length; i++)
            {
                Station station = Data.stations[i];
                if (station.effect == effect)
                    result *= 1 + State.stations[i] * station.bonusPerLevel;
            }
            return result;
        }

        public double ClickPower
        {
            get
            {
                double basePower = 1;
                for (int i = 0; i < Data.stations.Length; i++)
                {
                    Station station = Data.stations[i];
                    if (station.effect == "click")
                        basePower += State.stations[i] * station.bonusPerLevel;
                }
                return basePower * Effect("bones") * Effect("global") * LevelMultiplier;
            }
        }

        public double AutoClicks
        {
            get
            {
                double total = 0;
                for (int i = 0; i < Data.automation.Length; i++)
                    total += State.automation[i] * Data.automation[i].clicksPerSecond;
                return total;
            }
        }

        public bool HasUpgrade(Upgrade upgrade) => Array.IndexOf(State.upgrades, upgrade.id) >= 0;

        public double PerUnit(int index)
        {
            Unit unit = Data.units[index];
            double rate = unit.baseRate;
            foreach (Upgrade upgrade in unit.upgrades)
                if (HasUpgrade(upgrade)) rate *= upgrade.multiplier;
            return rate * Effect(unit.produces) * Effect("global") * LevelMultiplier;
        }

        public Production Rates()
        {
            var rates = new Production();
            for (int i = 0; i < Data.units.Length; i++)
                if (State.units[i] > 0) rates.Add(Data.units[i].produces, State.units[i] * PerUnit(i));
            rates.bones += AutoClicks * ClickPower;
            return rates;
        }

        public Production Advance(double seconds)
        {
            Production gain = Rates();
            gain.gold *= seconds;
            gain.bones *= seconds;
            gain.essence *= seconds;
            State.gold += gain.gold;
            State.totalGold += gain.gold;
            State.bones += gain.bones;
            State.essence += gain.essence;
            return gain;
        }

        public void Conjure()
        {
            State.bones += ClickPower;
            State.clicks++;
            FinishAction(1);
        }

        public double UnitCost(int index, int quantity = 1)
        {
            Unit unit = Data.units[index];
            double first = unit.cost * Math.Pow(unit.costGrowth, State.units[index]);
            return quantity <= 1 ? first : first * (Math.Pow(unit.costGrowth, quantity) - 1) / (unit.costGrowth - 1);
        }

        public int AffordableUnits(int index)
        {
            double first = UnitCost(index);
            if (double.IsInfinity(first) || State.bones < first) return 0;
            double growth = Data.units[index].costGrowth;
            double ratio = Math.Min(State.bones, double.MaxValue) / first * (growth - 1);
            int count = Math.Max(1, (int)Math.Floor(Math.Log(1 + ratio) / Math.Log(growth)));
            // Corrige arredondamentos na fronteira do custo da série geométrica.
            while (count > 1 && UnitCost(index, count) > State.bones) count--;
            if (UnitCost(index, count + 1) <= Math.Min(State.bones, double.MaxValue)) count++;
            return count;
        }

        public double StationCost(int index)
        {
            Station station = Data.stations[index];
            return Round(station.baseCost * Math.Pow(station.costGrowth, State.stations[index]));
        }

        public double AutomationCost(int index)
        {
            Automation item = Data.automation[index];
            return Round(item.cost * Math.Pow(item.costGrowth, State.automation[index]));
        }

        public bool BuyUnit(int index, bool maximum)
        {
            int count = maximum ? AffordableUnits(index) : 1;
            if (count == 0 || !Spend("bones", UnitCost(index, count))) return false;
            State.units[index] += count;
            State.purchases += count;
            FinishAction(count * 2);
            return true;
        }

        public bool BuyStation(int index)
        {
            if (!Spend("gold", StationCost(index))) return false;
            State.stations[index]++;
            FinishAction(10);
            return true;
        }

        public bool BuyAutomation(int index)
        {
            if (!Spend("essence", AutomationCost(index))) return false;
            State.automation[index]++;
            State.purchases++;
            FinishAction(12);
            return true;
        }

        public bool BuyUpgrade(int index, Upgrade upgrade)
        {
            if (HasUpgrade(upgrade) || State.units[index] < upgrade.requirement || !Spend(upgrade.currency, upgrade.cost))
                return false;
            int length = State.upgrades.Length;
            Array.Resize(ref State.upgrades, length + 1);
            State.upgrades[length] = upgrade.id;
            FinishAction(15);
            return true;
        }

        public int UnitIndex(string id) => Array.FindIndex(Data.units, unit => unit.id == id);
        private int Units(string id) => State.units[UnitIndex(id)];
        private int StationLevel(string id) => State.stations[Array.FindIndex(Data.stations, station => station.id == id)];

        public bool Evolve(int index)
        {
            Unit unit = Data.units[index];
            int target = UnitIndex(unit.evolvesTo);
            if (target < 0 || State.units[index] < unit.evolutionCost) return false;
            State.units[index] -= unit.evolutionCost;
            State.units[target]++;
            FinishAction(20);
            return true;
        }

        public int Progress(Objective objective) => objective.id switch
        {
            "esqueletos-5" => Units("esqueleto"),
            "cliques-25" => State.clicks,
            "cemiterio-3" => StationLevel("cemiterio"),
            "zumbis-5" => Units("zumbi"),
            "nivel-5" => State.level,
            "cavaleiros-10" => Units("cavaleiro"),
            "cripta-5" => StationLevel("cripta"),
            "portal-1" => StationLevel("portal"),
            _ => 0
        };

        public bool Unlocked(Achievement achievement) => achievement.id switch
        {
            "primeiro-morto" => Units("esqueleto") >= 1,
            "cemiterio-cheio" => Units("esqueleto") >= 50,
            "maos-calejadas" => State.clicks >= 250,
            "legiao" => TotalUnits() >= 100,
            "aprendiz" => Units("necromante") >= 1,
            "fortuna" => State.gold >= 1_000_000,
            "nivel-10" => State.level >= 10,
            "dragao" => Units("dragao") >= 1,
            "alem-portal" => StationLevel("portal") >= 1,
            _ => false
        };

        private int TotalUnits()
        {
            int total = 0;
            foreach (int count in State.units) total += count;
            return total;
        }

        private bool Spend(string resource, double cost)
        {
            if (double.IsInfinity(cost) || double.IsNaN(cost) || State.Balance(resource) < cost) return false;
            State.Add(resource, -cost);
            return true;
        }

        private void GrantXp(int amount)
        {
            State.xp += amount;
            while (State.xp >= XpNeeded(State.level))
            {
                State.xp -= XpNeeded(State.level);
                State.level++;
            }
        }

        private void FinishAction(int xp)
        {
            GrantXp(xp);
            while (State.objectiveIndex < Data.objectives.Length)
            {
                Objective objective = Data.objectives[State.objectiveIndex];
                if (Progress(objective) < objective.target) break;
                State.gold += objective.reward;
                State.objectiveIndex++;
                GrantXp(25);
            }
        }
    }
}
